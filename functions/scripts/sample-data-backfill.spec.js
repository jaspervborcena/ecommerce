import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SAMPLE_COLLECTIONS,
  buildSampleDocuments,
  insertSampleDocuments
} from './sample-data-backfill.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixture = JSON.parse(readFileSync(path.join(repositoryRoot, 'postman-sample-data.json'), 'utf8'));
const backfillScript = path.join(repositoryRoot, 'functions', 'scripts', 'sample-data-backfill.js');

class MemoryFirestore {
  documents = new Map();
  commits = 0;

  doc(path) {
    return { path };
  }

  batch() {
    const writes = [];
    return {
      set: (reference, data, options) => writes.push({ path: reference.path, data, options }),
      commit: async () => {
        this.commits += 1;
        for (const write of writes) {
          const previous = this.documents.get(write.path) || {};
          this.documents.set(write.path, write.options.merge ? { ...previous, ...write.data } : write.data);
        }
      }
    };
  }
}

function findTypeScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTypeScriptFiles(entryPath);
    return entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

test('builds linked sample documents for every app and rules collection', () => {
  const documents = buildSampleDocuments(fixture);
  const collectionNames = new Set(documents.map(({ path }) => {
    const segments = path.split('/');
    return segments.filter((_, index) => index % 2 === 0).join('/');
  }));

  for (const collection of SAMPLE_COLLECTIONS) {
    assert.ok(collectionNames.has(collection), `missing ${collection}`);
  }
  assert.ok(collectionNames.has('companies'));
  assert.ok(collectionNames.has('companies/stores'));
  assert.ok(collectionNames.has('companies/stores/branches/inventory'));
  assert.ok(collectionNames.has('companies/stores/branches/transactions'));

  const referencedCollections = new Set();
  for (const sourceFile of findTypeScriptFiles(path.join(repositoryRoot, 'src', 'app'))) {
    const source = readFileSync(sourceFile, 'utf8');
    for (const match of source.matchAll(/collection\s*\(\s*[^,\n]+,\s*['"`]([A-Za-z][A-Za-z0-9_]*)['"`]/g)) {
      referencedCollections.add(match[1]);
    }
  }
  const rules = readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8').split('service firebase.storage')[0];
  for (const match of rules.matchAll(/match\s+\/([A-Za-z][A-Za-z0-9_]*)\s*\/\{/g)) {
    if (match[1] !== 'databases') referencedCollections.add(match[1]);
  }
  for (const collection of referencedCollections) {
    assert.ok(SAMPLE_COLLECTIONS.includes(collection), `no backfill data for ${collection}`);
  }

  const byPath = new Map(documents.map((document) => [document.path, document.data]));
  for (let index = 1; index <= 3; index += 1) {
    const suffix = String(index).padStart(3, '0');
    const company = byPath.get(`companies/sample-company-${suffix}`);
    const store = byPath.get(`stores/sample-store-${suffix}`);
    const branch = byPath.get(`branches/sample-branch-${suffix}`);
    const product = byPath.get(`products/sample-product-${suffix}`);
    const order = byPath.get(`orders/ORDER-${suffix}`);
    const orderDetails = byPath.get(`orderDetails/sample-order-detail-${suffix}`);

    assert.equal(company.ownerUid, `sample-user-${suffix}`);
    assert.equal(store.companyId, `sample-company-${suffix}`);
    assert.equal(branch.storeId, `sample-store-${suffix}`);
    assert.equal(branch.companyId, `sample-company-${suffix}`);
    assert.equal(product.companyId, `sample-company-${suffix}`);
    assert.equal(product.storeId, `sample-store-${suffix}`);
    assert.equal(product.branchId, `sample-branch-${suffix}`);
    assert.equal(order.items[0].productId, `sample-product-${suffix}`);
    assert.equal(orderDetails.orderId, `ORDER-${suffix}`);
    assert.ok(product.createdAt instanceof Date);
  }
});

test('inserts the same stable sample records on repeated backfills', async () => {
  const firestore = new MemoryFirestore();
  const documents = buildSampleDocuments(fixture);

  await insertSampleDocuments(firestore, documents);
  await insertSampleDocuments(firestore, documents);

  assert.equal(firestore.documents.size, documents.length);
  assert.equal(firestore.commits, 2);
  assert.equal(firestore.documents.get('products/sample-product-001').productName, 'Arabica Coffee');
});

test('refuses to write to a configured dev or prod project', () => {
  const firebaseRc = JSON.parse(readFileSync(path.join(repositoryRoot, '.firebaserc'), 'utf8'));
  const configuredProjectId = firebaseRc.projects.prod;
  const environment = { ...process.env };
  delete environment.FIRESTORE_EMULATOR_HOST;
  const result = spawnSync(
    process.execPath,
    [backfillScript, '--project-id', configuredProjectId, '--apply'],
    { cwd: repositoryRoot, encoding: 'utf8', env: environment }
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to write to a project configured as a dev\/prod alias/);
});

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const defaultFixturePath = path.join(repositoryRoot, 'postman-sample-data.json');

export const SAMPLE_COLLECTIONS = [
  'accessRequests',
  'branches',
  'categories',
  'companies',
  'companyBillingHistory',
  'coupons',
  'counters',
  'customers',
  'devices',
  'expenseLogs',
  'inventoryDeductionReversals',
  'inventoryTracking',
  'invoiceNumbers',
  'invoices',
  'notifications',
  'orderAccountingLedger',
  'orderDetails',
  'orders',
  'ordersSellingTracking',
  'permissions',
  'predefinedTypes',
  'productInventory',
  'productInventoryEntries',
  'productTags',
  'products',
  'reconciliationAuditLog',
  'reconciliationLog',
  'roleDefinition',
  'roledefinition',
  'storefront_orders',
  'stores',
  'subscriptionRequests',
  'subscriptions',
  'systemConfig',
  'test',
  'storefront_companies',
  'userRoles',
  'users'
];

const sampleIndex = (index) => String(index + 1).padStart(3, '0');
const sampleId = (kind, index) => `sample-${kind}-${sampleIndex(index)}`;
const orderId = (index) => `ORDER-${sampleIndex(index)}`;
const storeId = (index) => sampleId('store', index);
const companyId = (index) => sampleId('company', index);
const branchId = (index) => sampleId('branch', index);
const userId = (index) => sampleId('user', index);
const productId = (index) => sampleId('product', index);

function createSupplementalCollections() {
  const collections = {};

  for (let index = 0; index < 3; index += 1) {
    const number = sampleIndex(index);
    const shared = {
      uid: userId(index),
      companyId: companyId(index),
      storeId: storeId(index),
      branchId: branchId(index),
      createdAt: `2026-01-${String(index + 1).padStart(2, '0')}T09:00:00.000Z`,
      updatedAt: `2026-01-${String(index + 1).padStart(2, '0')}T09:00:00.000Z`
    };

    collections.accessRequests = collections.accessRequests || [];
    collections.accessRequests.push({
      ...shared,
      userId: userId(index),
      email: `user${index + 1}@example.com`,
      status: 'pending',
      requestedRole: ['cashier', 'manager', 'admin'][index]
    });

    collections.coupons = collections.coupons || [];
    collections.coupons.push({
      ...shared,
      code: `SAMPLE${number}`,
      discountType: 'percentage',
      discountValue: (index + 1) * 5,
      isActive: true,
      expiresAt: '2027-01-01T00:00:00.000Z'
    });

    collections.expenseLogs = collections.expenseLogs || [];
    collections.expenseLogs.push({
      ...shared,
      description: ['Utilities', 'Supplies', 'Maintenance'][index],
      amount: [1250, 850, 500][index],
      category: ['utilities', 'supplies', 'maintenance'][index],
      recordedBy: userId(index)
    });

    collections.inventoryDeductionReversals = collections.inventoryDeductionReversals || [];
    collections.inventoryDeductionReversals.push({
      ...shared,
      productId: productId(index),
      orderId: orderId(index),
      quantity: 1,
      reason: 'Sample test reversal',
      reversedBy: userId(index)
    });

    collections.inventoryTracking = collections.inventoryTracking || [];
    collections.inventoryTracking.push({
      ...shared,
      productId: productId(index),
      orderId: orderId(index),
      batchId: sampleId('inventory', index),
      quantity: 1,
      type: 'deduction',
      status: 'completed'
    });

    collections.orderAccountingLedger = collections.orderAccountingLedger || [];
    collections.orderAccountingLedger.push({
      ...shared,
      orderId: orderId(index),
      invoiceNumber: `INV-${number}`,
      entryType: 'sale',
      debit: 0,
      credit: [320, 36, 25][index],
      total: [320, 36, 25][index]
    });

    collections.productTags = collections.productTags || [];
    collections.productTags.push({
      ...shared,
      tagId: sampleId('tag', index),
      name: ['Coffee', 'Drinks', 'Services'][index],
      productIds: [productId(index)]
    });

    collections.reconciliationAuditLog = collections.reconciliationAuditLog || [];
    collections.reconciliationAuditLog.push({
      ...shared,
      orderId: orderId(index),
      invoiceNumber: `INV-${number}`,
      performedBy: userId(index),
      action: 'flag_review',
      success: true,
      beforeState: { inventoryProcessed: false, ledgerProcessed: false, needsReconciliation: true },
      afterState: { inventoryProcessed: true, ledgerProcessed: true, needsReconciliation: false }
    });

    collections.roleDefinition = collections.roleDefinition || [];
    collections.roleDefinition.push({
      ...shared,
      roleId: `role-${['admin', 'manager', 'cashier'][index]}`,
      name: ['Administrator', 'Manager', 'Cashier'][index],
      permissions: ['products.read', 'orders.read']
    });

    collections.storefront_orders = collections.storefront_orders || [];
    collections.storefront_orders.push({
      ...shared,
      orderId: `STOREFRONT-${number}`,
      customerName: ['Alex Santos', 'Jamie Reyes', 'Taylor Cruz'][index],
      status: 'pending',
      items: [{ productId: productId(index), quantity: 1 }]
    });

    collections.storefront_companies = collections.storefront_companies || [];
    collections.storefront_companies.push({
      companyId: companyId(index),
      slug: companyId(index),
      name: `Sample Company ${number}`,
      status: 'active'
    });

    collections.subscriptionRequests = collections.subscriptionRequests || [];
    collections.subscriptionRequests.push({
      ...shared,
      requestedPlan: ['standard', 'premium', 'enterprise'][index],
      status: 'pending',
      requestedBy: userId(index)
    });

    collections.test = collections.test || [];
    collections.test.push({
      ...shared,
      name: `Sample test document ${number}`,
      purpose: 'Development collection smoke test'
    });
  }

  return collections;
}

function documentId(collectionName, record, index) {
  switch (collectionName) {
    case 'branches': return branchId(index);
    case 'companies': return companyId(index);
    case 'customers': return record.customerId || sampleId('customer', index);
    case 'devices': return sampleId('device', index);
    case 'orders': return orderId(index);
    case 'orderDetails': return sampleId('order-detail', index);
    case 'permissions': return userId(index);
    case 'products': return productId(index);
    case 'roleDefinition':
    case 'roledefinition': return record.roleId || sampleId('role', index);
    case 'stores': return storeId(index);
    case 'storefront_companies': return record.slug || companyId(index);
    case 'users': return userId(index);
    case 'userRoles': return sampleId('user-role', index);
    default: return sampleId(collectionName.replace(/[^a-zA-Z0-9]+/g, '-'), index);
  }
}

function linkRecord(collectionName, record, index) {
  const linked = structuredClone(record);
  const user = userId(index);
  const company = companyId(index);
  const store = storeId(index);
  const branch = branchId(index);
  const product = productId(index);

  if (collectionName === 'storefront_companies') {
    linked.companyId = company;
    linked.slug = company;
    return linked;
  }

  if (collectionName === 'companies') {
    linked.uid = user;
    linked.ownerUid = user;
    return linked;
  }

  linked.uid = user;
  linked.companyId = company;
  linked.storeId = store;
  linked.branchId = branch;

  if (collectionName === 'users') {
    linked.uid = user;
    linked.companyId = company;
    linked.storeId = store;
  }
  if (collectionName === 'stores') linked.companyId = company;
  if (collectionName === 'branches') {
    linked.companyId = company;
    linked.storeId = store;
    linked.assignedUsers = [user];
  }
  if (collectionName === 'userRoles' || collectionName === 'permissions') {
    linked.userId = user;
  }
  if (collectionName === 'products') {
    linked.branchId = branch;
    linked.tags = [sampleId('tag', index)];
    linked.tagLabels = [['Coffee', 'Drinks', 'Services'][index]];
  }
  if (collectionName === 'productTags') linked.productIds = [product];
  if (collectionName === 'notifications') {
    linked.recipientId = linked.recipientType === 'company'
      ? company
      : linked.recipientType === 'store'
        ? store
        : user;
    if (linked.actionData?.entityType === 'product') {
      linked.actionData.entityId = product;
    }
  }
  if (['productInventory', 'productInventoryEntries', 'inventoryTracking', 'inventoryDeductionReversals'].includes(collectionName)) {
    linked.productId = product;
  }
  if (['orders', 'orderDetails', 'ordersSellingTracking', 'reconciliationLog', 'orderAccountingLedger', 'reconciliationAuditLog', 'invoices', 'storefront_orders'].includes(collectionName)) {
    linked.orderId = collectionName === 'storefront_orders' ? `STOREFRONT-${sampleIndex(index)}` : orderId(index);
  }
  if (collectionName === 'orders' && Array.isArray(linked.items)) {
    linked.items = linked.items.map((item) => ({ ...item, productId: product }));
  }
  if (collectionName === 'orderDetails' && Array.isArray(linked.items)) {
    linked.items = linked.items.map((item) => ({ ...item, productId: product }));
  }
  if (collectionName === 'ordersSellingTracking') linked.productId = product;
  if (collectionName === 'invoices' || collectionName === 'orderAccountingLedger' || collectionName === 'reconciliationAuditLog') {
    linked.invoiceNumber = `INV-${sampleIndex(index)}`;
  }

  return linked;
}

function convertDateFields(value, fieldName = '') {
  if (Array.isArray(value)) {
    return value.map((item) => convertDateFields(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, convertDateFields(child, key)])
    );
  }
  if (
    typeof value === 'string' &&
    (fieldName === 'date' || /(?:At|Date)$/i.test(fieldName)) &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Date(value);
  }
  return value;
}

export function buildSampleDocuments(fixture) {
  const completeFixture = { ...fixture, ...createSupplementalCollections() };
  const documents = [];

  for (const collectionName of SAMPLE_COLLECTIONS) {
    const records = completeFixture[collectionName];
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error(`Missing sample records for Firestore collection "${collectionName}".`);
    }

    records.forEach((record, index) => {
      const linkedRecord = convertDateFields(linkRecord(collectionName, record, index));
      documents.push({
        path: `${collectionName}/${documentId(collectionName, linkedRecord, index)}`,
        data: linkedRecord
      });
    });
  }

  for (let index = 0; index < 3; index += 1) {
    const shared = {
      uid: userId(index),
      companyId: companyId(index),
      storeId: storeId(index),
      branchId: branchId(index),
      createdAt: new Date(`2026-01-${String(index + 1).padStart(2, '0')}T09:00:00.000Z`)
    };
    const companyStore = `companies/${companyId(index)}/stores/${storeId(index)}`;
    const nestedBase = `companies/${companyId(index)}/stores/${storeId(index)}/branches/${branchId(index)}`;
    documents.push({
      path: companyStore,
      data: { ...shared, name: ['Sample Main Store', 'Sample North Store', 'Sample South Store'][index], status: 'active' }
    });
    documents.push({
      path: `${nestedBase}/inventory/${sampleId('nested-inventory', index)}`,
      data: { ...shared, productId: productId(index), quantity: 10, status: 'active' }
    });
    documents.push({
      path: `${nestedBase}/transactions/${sampleId('transaction', index)}`,
      data: { ...shared, orderId: orderId(index), type: 'sale', amount: [320, 36, 25][index] }
    });
  }

  return documents;
}

function replacePlaceholders(value, replacements) {
  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholders(item, replacements));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, replacePlaceholders(child, replacements)])
    );
  }
  if (typeof value !== 'string') return value;
  return Object.entries(replacements).reduce(
    (result, [placeholder, replacement]) => result.replaceAll(`{{${placeholder}}}`, () => replacement),
    value
  );
}

export function buildJourneyDocuments(fixture, accountValues) {
  const requiredValues = ['ownerUid', 'ownerEmail', 'shopperUid', 'shopperEmail'];
  for (const key of requiredValues) {
    if (typeof accountValues[key] !== 'string' || !accountValues[key].trim()) {
      throw new Error(`Provide a non-empty value for ${key}.`);
    }
  }
  if (accountValues.ownerUid.includes('/') || accountValues.shopperUid.includes('/')) {
    throw new Error('Firebase Auth UIDs must not contain "/".');
  }
  if (accountValues.ownerUid === accountValues.shopperUid) {
    throw new Error('The owner and shopper must use different Firebase Auth UIDs.');
  }
  if (!Array.isArray(fixture.documents) || fixture.documents.length === 0) {
    throw new Error('Journey fixture must contain a non-empty documents array.');
  }

  const replacements = {
    OWNER_UID: accountValues.ownerUid,
    OWNER_EMAIL: accountValues.ownerEmail,
    SHOPPER_UID: accountValues.shopperUid,
    SHOPPER_EMAIL: accountValues.shopperEmail
  };
  const seenPaths = new Set();
  return fixture.documents.map((entry) => {
    const resolved = replacePlaceholders(entry, replacements);
    if (JSON.stringify(resolved).match(/\{\{[^{}]+\}\}/)) {
      throw new Error(`Unresolved placeholder in journey document "${resolved.path || ''}".`);
    }
    if (typeof resolved.path !== 'string') {
      throw new Error('Each journey fixture entry must have a Firestore document path.');
    }
    const segments = resolved.path.split('/');
    if (segments.length % 2 !== 0 || segments.some((segment) => !segment)) {
      throw new Error(`Invalid Firestore document path "${resolved.path}".`);
    }
    if (seenPaths.has(resolved.path)) {
      throw new Error(`Duplicate Firestore document path "${resolved.path}".`);
    }
    if (!resolved.data || typeof resolved.data !== 'object' || Array.isArray(resolved.data)) {
      throw new Error(`Document "${resolved.path}" must have an object data body.`);
    }
    seenPaths.add(resolved.path);
    return {
      path: resolved.path,
      data: convertDateFields(resolved.data)
    };
  });
}

export async function insertSampleDocuments(db, documents) {
  for (let offset = 0; offset < documents.length; offset += 450) {
    const batch = db.batch();
    for (const document of documents.slice(offset, offset + 450)) {
      batch.set(db.doc(document.path), document.data, { merge: true });
    }
    await batch.commit();
  }
}

function parseArguments(args) {
  const options = {
    apply: false,
    allowConfiguredProject: false,
    projectId: '',
    fixturePath: defaultFixturePath,
    ownerUid: '',
    ownerEmail: '',
    shopperUid: '',
    shopperEmail: ''
  };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--apply') {
      options.apply = true;
    } else if (args[index] === '--allow-configured-project') {
      options.allowConfiguredProject = true;
    } else if (args[index] === '--project-id' && args[index + 1]) {
      options.projectId = args[index + 1];
      index += 1;
    } else if (args[index] === '--fixture' && args[index + 1]) {
      options.fixturePath = path.resolve(repositoryRoot, args[index + 1]);
      index += 1;
    } else if (args[index] === '--owner-uid' && args[index + 1]) {
      options.ownerUid = args[index + 1];
      index += 1;
    } else if (args[index] === '--owner-email' && args[index + 1]) {
      options.ownerEmail = args[index + 1];
      index += 1;
    } else if (args[index] === '--shopper-uid' && args[index + 1]) {
      options.shopperUid = args[index + 1];
      index += 1;
    } else if (args[index] === '--shopper-email' && args[index + 1]) {
      options.shopperEmail = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${args[index]}`);
    }
  }
  if (!options.projectId) {
    throw new Error('Provide an explicit destination with --project-id <firebase-project-id>.');
  }
  return options;
}

async function assertNotConfiguredProject(projectId, allowConfiguredProject) {
  const firebaseRcPath = path.join(repositoryRoot, '.firebaserc');
  const firebaseRc = JSON.parse(await readFile(firebaseRcPath, 'utf8'));
  const configuredProjects = Object.values(firebaseRc.projects || {});
  if (
    !process.env.FIRESTORE_EMULATOR_HOST &&
    configuredProjects.includes(projectId) &&
    !allowConfiguredProject
  ) {
    throw new Error(
      'Refusing to write to a project configured as a dev/prod alias. Use the Firestore Emulator, a separate test project, or explicitly pass --allow-configured-project.'
    );
  }
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const fixture = JSON.parse(await readFile(options.fixturePath, 'utf8'));
    const isJourneyFixture = Array.isArray(fixture.documents);
    const documents = isJourneyFixture
      ? buildJourneyDocuments(fixture, options)
      : buildSampleDocuments(fixture);

    console.log(`Prepared ${documents.length} ${isJourneyFixture ? 'journey' : 'sample'} documents.`);
    console.log(`Destination project: ${options.projectId}`);
    if (!options.apply) {
      console.log('Dry run only. Add --apply to write these sample documents.');
      return;
    }

    await assertNotConfiguredProject(options.projectId, options.allowConfiguredProject);
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const app = getApps()[0] || initializeApp({ projectId: options.projectId });
    await insertSampleDocuments(getFirestore(app), documents);
    console.log(`Inserted/updated ${documents.length} sample documents.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

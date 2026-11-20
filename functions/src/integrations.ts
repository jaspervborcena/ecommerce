import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { randomBytes, createHash } from 'crypto';
import {
  canTransitionStorefrontOrder,
  normalizeStorefrontOrderStatus
} from './storefront-order-status.js';
import type { StorefrontOrderStatus } from './storefront-order-status.js';

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

class StorefrontOrdersApiError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
  }
}

async function getAuthenticatedUid(req: express.Request, res: express.Response): Promise<string | null> {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication is required.' });
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: 'Authentication is invalid or expired.' });
    return null;
  }
}

async function requireStorefrontOrderStaff(uid: string, storeId: string): Promise<void> {
  const storeSnapshot = await db.collection('stores').doc(storeId).get();
  if (!storeSnapshot.exists) {
    throw new StorefrontOrdersApiError(404, 'Store not found.');
  }

  const store = storeSnapshot.data() || {};
  const ownerUid = typeof store['uid'] === 'string' ? store['uid'] : '';
  if (ownerUid && uid === ownerUid) {
    return;
  }
  if (!ownerUid || typeof store['companyId'] !== 'string') {
    throw new StorefrontOrdersApiError(403, 'You are not allowed to manage this store.');
  }

  const roleSnapshot = await db.collection('userRoles').where('userId', '==', uid).get();
  const hasStoreRole = roleSnapshot.docs.some(document => {
    const role = document.data();
    return role['uid'] === ownerUid &&
      role['companyId'] === store['companyId'] &&
      role['storeId'] === storeId &&
      ['store_manager', 'manager', 'cashier', 'attendant'].includes(role['roleId']);
  });
  if (!hasStoreRole) {
    throw new StorefrontOrdersApiError(403, 'You are not allowed to manage this store.');
  }
}

function sendStorefrontOrdersApiError(res: express.Response, error: unknown): void {
  if (error instanceof StorefrontOrdersApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error('Storefront API failed.', error);
  res.status(500).json({ error: 'Could not process the storefront request.' });
}

function toIsoDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === 'string' ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function nonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatBranchAddress(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  const address = asRecord(value);
  return ['street', 'city', 'state', 'zipCode', 'country']
    .map(field => nonEmptyString(address[field]))
    .filter(Boolean)
    .join(', ');
}

async function findActiveStore(storeId: string, companyId: string) {
  const stores = await db.collection('stores')
    .where('companyId', '==', companyId)
    .get();
  return stores.docs.find(document =>
    (document.id === storeId || document.data()['id'] === storeId) &&
    document.data()['status'] === 'active'
  ) || null;
}

function toPublicStorefrontProduct(
  productId: string,
  product: Record<string, unknown>,
  storeId: string,
  companyId: string
): Record<string, unknown> | null {
  const productStoreId = nonEmptyString(product['storeId']);
  const productCompanyId = nonEmptyString(product['companyId']);
  const productName = nonEmptyString(product['productName']);
  const sellingPrice = product['sellingPrice'];
  if (product['status'] !== 'active' ||
      productStoreId !== storeId ||
      (productCompanyId && productCompanyId !== companyId) ||
      !productName ||
      typeof sellingPrice !== 'number' ||
      !Number.isFinite(sellingPrice)) {
    return null;
  }

  const publicProduct: Record<string, unknown> = {
    id: productId,
    storeId,
    productName,
    sellingPrice,
    currency: nonEmptyString(product['currency']) || 'PHP'
  };
  for (const field of ['shortDescription', 'description', 'skuId', 'category', 'unitType', 'imageUrl']) {
    const value = product[field];
    if (typeof value === 'string' && value.trim()) {
      publicProduct[field] = value.trim();
    }
  }
  return publicProduct;
}

app.get('/v1/storefront/locations', async (req, res) => {
  const companyId = typeof req.query['companyId'] === 'string' ? req.query['companyId'].trim() : '';
  if (!companyId || companyId.length > 128) {
    res.status(400).json({ error: 'A valid companyId is required.' });
    return;
  }

  try {
    const storesSnapshot = await db.collection('stores')
      .where('companyId', '==', companyId)
      .get();
    res.json({
      locations: storesSnapshot.docs
        .filter(document => document.data()['status'] === 'active')
        .map(document => {
          const store = document.data();
          return {
            id: document.id,
            companyId,
            storeId: document.id,
            branchName: nonEmptyString(store['branchName']) || nonEmptyString(store['storeName']),
            address: nonEmptyString(store['address']),
            status: 'active',
            storeHours: nonEmptyString(store['storeHours']) || 'Hours not listed'
          };
        })
        .filter(location => location.branchName)
    });
  } catch (error) {
    sendStorefrontOrdersApiError(res, error);
  }
});

app.get('/v1/storefront/products', async (req, res) => {
  const storeId = typeof req.query['storeId'] === 'string' ? req.query['storeId'].trim() : '';
  const companyId = typeof req.query['companyId'] === 'string' ? req.query['companyId'].trim() : '';
  if (!storeId || !companyId || storeId.length > 128 || companyId.length > 128) {
    res.status(400).json({ error: 'Valid storeId and companyId are required.' });
    return;
  }

  try {
    const store = await findActiveStore(storeId, companyId);
    if (!store) {
      throw new StorefrontOrdersApiError(404, 'The selected store is unavailable.');
    }
    const products = await db.collection('products')
      .where('storeId', '==', storeId)
      .get();
    res.json({
      products: products.docs
        .map(document => toPublicStorefrontProduct(document.id, document.data(), storeId, companyId))
        .filter((product): product is Record<string, unknown> => product !== null)
    });
  } catch (error) {
    sendStorefrontOrdersApiError(res, error);
  }
});

app.get('/v1/storefront/products/:productId', async (req, res) => {
  const productId = req.params['productId'].trim();
  const companyId = typeof req.query['companyId'] === 'string' ? req.query['companyId'].trim() : '';
  if (!productId || productId.length > 128 || !companyId || companyId.length > 128) {
    res.status(400).json({ error: 'Valid productId and companyId are required.' });
    return;
  }

  try {
    const productSnapshot = await db.collection('products').doc(productId).get();
    if (!productSnapshot.exists) {
      throw new StorefrontOrdersApiError(404, 'Product not found.');
    }
    const product = productSnapshot.data() || {};
    const storeId = nonEmptyString(product['storeId']);
    const store = storeId ? await findActiveStore(storeId, companyId) : null;
    if (!store) {
      throw new StorefrontOrdersApiError(404, 'Product not found for this storefront.');
    }
    const publicProduct = toPublicStorefrontProduct(productSnapshot.id, product, storeId, companyId);
    if (!publicProduct) {
      throw new StorefrontOrdersApiError(404, 'Product is not available.');
    }
    res.json({ product: publicProduct });
  } catch (error) {
    sendStorefrontOrdersApiError(res, error);
  }
});

app.get('/v1/storefront/pickup-details', async (req, res) => {
  const storeId = typeof req.query['storeId'] === 'string' ? req.query['storeId'].trim() : '';
  const branchId = typeof req.query['branchId'] === 'string' ? req.query['branchId'].trim() : '';
  const requestedCompanyId = typeof req.query['companyId'] === 'string' ? req.query['companyId'].trim() : '';
  if ((!storeId && !branchId) || storeId.length > 128 || branchId.length > 128 || requestedCompanyId.length > 128) {
    res.status(400).json({ error: 'A valid companyId, storeId, or branchId is required.' });
    return;
  }

  try {
    let branch: Record<string, unknown> | null = null;
    let resolvedStoreId = storeId;
    let companyId = requestedCompanyId;

    if (branchId) {
      const branchSnapshot = await db.collection('branches').doc(branchId).get();
      branch = branchSnapshot.data() || {};
      if (!branchSnapshot.exists || branch['isActive'] !== true) {
        throw new StorefrontOrdersApiError(404, 'The selected branch is unavailable.');
      }

      const branchStoreId = nonEmptyString(branch['storeId']);
      const branchCompanyId = nonEmptyString(branch['companyId']);
      if ((storeId && storeId !== branchStoreId) ||
          (companyId && companyId !== branchCompanyId) ||
          !branchStoreId ||
          !branchCompanyId) {
        throw new StorefrontOrdersApiError(404, 'The selected branch is unavailable for this store.');
      }
      resolvedStoreId = branchStoreId;
      companyId = branchCompanyId;
    }

    if (!companyId || !resolvedStoreId) {
      throw new StorefrontOrdersApiError(400, 'A companyId and selected store are required.');
    }

    const storeSnapshot = await findActiveStore(resolvedStoreId, companyId);
    if (!storeSnapshot) {
      throw new StorefrontOrdersApiError(404, 'The selected store is unavailable.');
    }

    const store = storeSnapshot.data() || {};
    let branchName = nonEmptyString(store['branchName']);
    let address = nonEmptyString(store['address']);
    let phoneNumber = nonEmptyString(store['phoneNumber']);

    if (branch) {
      const settings = asRecord(branch['settings']);
      const contactInfo = asRecord(settings['contactInfo']);
      branchName = nonEmptyString(branch['name']);
      address = formatBranchAddress(branch['address']);
      phoneNumber = nonEmptyString(contactInfo['phone']) ||
        nonEmptyString(branch['phoneNumber']) ||
        phoneNumber;
    }

    const storeName = nonEmptyString(store['storeName']);
    if (!storeName || !branchName || !address) {
      throw new StorefrontOrdersApiError(422, 'The selected store or branch has incomplete pickup details.');
    }

    res.json({
      pickup: {
        storeName,
        branchName,
        address,
        phoneNumber,
        branchId: branchId || null
      }
    });
  } catch (error) {
    sendStorefrontOrdersApiError(res, error);
  }
});

app.get('/v1/storefront/orders', async (req, res) => {
  const uid = await getAuthenticatedUid(req, res);
  if (!uid) return;

  const storeId = typeof req.query['storeId'] === 'string' ? req.query['storeId'] : '';
  if (!storeId) {
    res.status(400).json({ error: 'storeId is required.' });
    return;
  }

  try {
    await requireStorefrontOrderStaff(uid, storeId);
    const snapshot = await db.collection('storefront_orders')
      .where('storeId', '==', storeId)
      .limit(100)
      .get();
    const orders = snapshot.docs.map(document => {
      const order = document.data();
      return {
        id: document.id,
        customerName: order['customerName'] || '',
        email: order['email'] || '',
        notes: order['notes'] || '',
        items: Array.isArray(order['items']) ? order['items'] : [],
        subtotal: order['subtotal'] || 0,
        total: order['total'] || 0,
        currency: order['currency'] || 'PHP',
        status: normalizeStorefrontOrderStatus(order['status']) || order['status'] || 'REQUEST',
        createdAt: toIsoDate(order['createdAt'])
      };
    }).sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''));
    res.json({ orders });
  } catch (error) {
    sendStorefrontOrdersApiError(res, error);
  }
});

app.patch('/v1/storefront/orders/:orderId', async (req, res) => {
  const uid = await getAuthenticatedUid(req, res);
  if (!uid) return;

  const storeId = typeof req.body?.storeId === 'string' ? req.body.storeId : '';
  const nextStatus = req.body?.status as StorefrontOrderStatus | undefined;
  if (!storeId || !['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(nextStatus || '')) {
    res.status(400).json({ error: 'storeId and a valid next status are required.' });
    return;
  }

  try {
    await requireStorefrontOrderStaff(uid, storeId);
    const orderRef = db.collection('storefront_orders').doc(req.params['orderId']);
    const status = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists || snapshot.data()?.['storeId'] !== storeId) {
        throw new StorefrontOrdersApiError(404, 'Order not found for this store.');
      }

      const order = snapshot.data() || {};
      if (!canTransitionStorefrontOrder(order['status'], nextStatus)) {
        throw new StorefrontOrdersApiError(409, 'This order cannot move to the requested status.');
      }

      const updatedAt = new Date();
      const statusHistory = Array.isArray(order['statusHistory']) ? [...order['statusHistory']] : [];
      statusHistory.push({ status: nextStatus, changedBy: uid, changedAt: updatedAt });
      transaction.update(orderRef, {
        status: nextStatus,
        updatedAt,
        statusHistory,
        ...(nextStatus === 'ACCEPTED' ? { acceptedAt: updatedAt, acceptedBy: uid } : {}),
        ...(nextStatus === 'REJECTED' ? { rejectedAt: updatedAt, rejectedBy: uid } : {}),
        ...(nextStatus === 'COMPLETED' ? { completedAt: updatedAt, completedBy: uid } : {})
      });
      return nextStatus;
    });

    res.json({ orderId: req.params['orderId'], status });
  } catch (error) {
    sendStorefrontOrdersApiError(res, error);
  }
});

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

// Helper to generate token id and secret
function generateTokenPair() {
  const tokenId = randomBytes(6).toString('hex');
  const secret = randomBytes(24).toString('hex');
  return { tokenId, secret };
}

// Create integration token (server/admin use). Returns tokenId and raw secret once.
app.post('/createToken', async (req, res) => {
  try {
    const { companyId, storeId = null, scopes = [], label = '', createdBy = null, expiresAt = null } = req.body;

    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const { tokenId, secret } = generateTokenPair();
    const tokenHash = hashSecret(secret);

    const tokenDoc = {
      tokenId,
      tokenHash,
      companyId,
      storeId,
      scopes,
      label,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt,
      revoked: false,
      lastUsedAt: null
    };

    await db.collection('integrationTokens').doc(tokenId).set(tokenDoc);

    // Return the raw secret only once. Caller must persist it securely.
    return res.json({ tokenId, secret });
  } catch (err) {
    console.error('createToken error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Endpoint that external sites will call to push products.
// Authentication: x-integration-token-id + x-integration-token-secret headers OR body
app.post('/v1/external/products', async (req, res) => {
  try {
    const headerTokenId = (req.header('x-integration-token-id') || req.body.tokenId || '').toString();
    const headerSecret = (req.header('x-integration-token-secret') || req.body.secret || '').toString();

    if (!headerTokenId || !headerSecret) return res.status(401).json({ error: 'missing token credentials' });

    const tokenRef = db.collection('integrationTokens').doc(headerTokenId);
    const tokenSnap = await tokenRef.get();

    if (!tokenSnap.exists) return res.status(401).json({ error: 'invalid token' });
    const token = tokenSnap.data() as any;
    if (token.revoked) return res.status(403).json({ error: 'token revoked' });
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) return res.status(403).json({ error: 'token expired' });

    const incomingHash = hashSecret(headerSecret);
    if (incomingHash !== token.tokenHash) return res.status(401).json({ error: 'invalid secret' });

    // Check scope
    const scopes: string[] = token.scopes || [];
    if (!scopes.includes('products:write')) return res.status(403).json({ error: 'insufficient scope' });

    const payload = req.body.product;
    if (!payload) return res.status(400).json({ error: 'missing product payload' });

    const doc = {
      sourceId: payload.sourceId || payload.id || null,
      sourceType: payload.sourceType || 'external',
      companyId: token.companyId,
      storeId: token.storeId || null,
      data: payload,
      mappedProductId: null,
      status: 'pending',
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: null
    };

    const docRef = await db.collection('externalProducts').add(doc);

    // Update lastUsedAt on the token
    await tokenRef.update({ lastUsedAt: new Date().toISOString() });

    return res.json({ ok: true, id: docRef.id });

  } catch (err) {
    console.error('external products error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

export default app;

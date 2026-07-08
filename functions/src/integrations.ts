import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { randomBytes, createHash } from 'crypto';

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

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

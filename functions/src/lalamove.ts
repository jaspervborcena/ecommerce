import { createHmac, randomUUID } from 'node:crypto';
import admin from 'firebase-admin';
import cors from 'cors';
import express from 'express';
import fetch from 'node-fetch';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

const apiKey = defineSecret('LALAMOVE_API_KEY');
const apiSecret = defineSecret('LALAMOVE_API_SECRET');
const lalamoveApiUrl = 'https://rest.sandbox.lalamove.com';
const quotationPath = '/v3/quotations';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '16kb' }));

interface Coordinates {
  lat: number;
  lng: number;
}

function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const coordinates = value as Record<string, unknown>;
  return typeof coordinates['lat'] === 'number' &&
    Number.isFinite(coordinates['lat']) &&
    coordinates['lat'] >= -90 &&
    coordinates['lat'] <= 90 &&
    typeof coordinates['lng'] === 'number' &&
    Number.isFinite(coordinates['lng']) &&
    coordinates['lng'] >= -180 &&
    coordinates['lng'] <= 180;
}

app.post('/', async (req, res) => {
  const authorization = req.header('authorization') || '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) {
    res.status(401).json({ error: 'Sign in is required to request a delivery quote.' });
    return;
  }

  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: 'Your session expired. Please sign in again.' });
    return;
  }

  const storeId = typeof req.body?.storeId === 'string' ? req.body.storeId.trim() : '';
  const pickupCoordinates = req.body?.pickupCoordinates;
  const destination = req.body?.destination;
  const destinationAddress = typeof destination?.address === 'string' ? destination.address.trim() : '';
  const destinationCoordinates = destination?.coordinates;

  if (!storeId || !destinationAddress || destinationAddress.length > 500 ||
      !isCoordinates(pickupCoordinates) || !isCoordinates(destinationCoordinates)) {
    res.status(400).json({ error: 'A valid store and resolved pickup and delivery addresses are required.' });
    return;
  }

  const credentialKey = apiKey.value();
  const credentialSecret = apiSecret.value();
  if (!credentialKey || !credentialSecret) {
    res.status(503).json({ error: 'Lalamove sandbox credentials are not configured on the server.' });
    return;
  }

  try {
    const storeSnapshot = await db.collection('stores').doc(storeId).get();
    if (!storeSnapshot.exists) {
      res.status(404).json({ error: 'Store pickup details could not be found.' });
      return;
    }

    const store = storeSnapshot.data() || {};
    const pickupAddress = typeof store['address'] === 'string' ? store['address'].trim() : '';
    if (!pickupAddress || !store['storeName'] || !store['branchName']) {
      res.status(422).json({ error: 'The store pickup details are incomplete.' });
      return;
    }

    const requestBody = JSON.stringify({
      data: {
        serviceType: 'MOTORCYCLE',
        language: 'en_PH',
        stops: [
          {
            coordinates: {
              lat: String(pickupCoordinates.lat),
              lng: String(pickupCoordinates.lng)
            },
            address: pickupAddress
          },
          {
            coordinates: {
              lat: String(destinationCoordinates.lat),
              lng: String(destinationCoordinates.lng)
            },
            address: destinationAddress
          }
        ]
      }
    });
    const timestamp = Date.now().toString();
    const rawSignature = `${timestamp}\r\nPOST\r\n${quotationPath}\r\n\r\n${requestBody}`;
    const signature = createHmac('sha256', credentialSecret).update(rawSignature).digest('hex');
    const requestId = randomUUID();
    const response = await fetch(`${lalamoveApiUrl}${quotationPath}`, {
      method: 'POST',
      headers: {
        Authorization: `hmac ${credentialKey}:${timestamp}:${signature}`,
        Market: 'PH',
        'Request-ID': requestId,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });
    const responseBody = await response.json() as {
      data?: {
        quotationId?: string;
        expiresAt?: string;
        serviceType?: string;
        priceBreakdown?: {
          total?: string;
          currency?: string;
        };
      };
      message?: string;
    };

    if (!response.ok) {
      console.error('Lalamove sandbox quotation request was rejected.', { status: response.status, requestId });
      if (response.status === 429) {
        res.status(429).json({ error: 'Lalamove sandbox rate limit reached. Please wait and try again.' });
        return;
      }
      res.status(502).json({ error: 'Lalamove could not provide a quote for this route. Check the addresses and try again.' });
      return;
    }

    const quote = responseBody.data;
    const fee = Number(quote?.priceBreakdown?.total);
    const quoteCurrency = quote?.priceBreakdown?.currency;
    if (!quote?.quotationId || !Number.isFinite(fee) || fee < 0 || !quoteCurrency) {
      console.error('Lalamove sandbox quotation response was incomplete.');
      res.status(502).json({ error: 'Lalamove returned an incomplete delivery quote. Please try again.' });
      return;
    }

    res.json({
      quote: {
        quotationId: quote.quotationId,
        expiresAt: quote.expiresAt || null,
        serviceType: quote.serviceType || 'MOTORCYCLE',
        fee,
        currency: quoteCurrency
      }
    });
  } catch (error) {
    console.error('Lalamove sandbox quotation request failed.', error);
    res.status(500).json({ error: 'Could not retrieve a Lalamove delivery quote. Please try again.' });
  }
});

export const lalamoveQuote = onRequest(
  {
    region: 'asia-east1',
    secrets: [apiKey, apiSecret]
  },
  app
);

# Integration Security Notes

This file records a minimal draft for how to secure external integrations that push products/collections to Firestore.

Key points:

- Token issuance: tokens must be generated on a trusted server (Cloud Function). The raw secret is returned only once to the caller; only a hashed secret is stored in Firestore (`integrationTokens/{tokenId}`).
- Scopes: tokens include `scopes` (e.g. `products:write`, `collections:write`). Cloud Function checks scopes before accepting writes.
- Firestore collections:
  - `integrationTokens` documents: `tokenId`, `tokenHash`, `companyId`, `storeId`, `scopes`, `revoked`, `expiresAt`, `lastUsedAt`.
  - `externalProducts` documents: store incoming product payloads, `status` (`pending|synced|failed`), `mappedProductId`, `errorMessage`.
- Direct client writes to Firestore from external sites must be avoided. External sites should call the Cloud Function endpoint which validates token and writes to Firestore.
- Rules draft (to implement later):

  - Deny public writes to `externalProducts` and `integrationTokens`.
  - Allow Cloud Functions service account to write to these collections.
  - Optionally allow merchants (authenticated admin users) to read/write their own `externalProducts` where `companyId` matches and role checks pass.

See `functions/src/integrations.ts` for the initial token creation and external product ingestion endpoints.

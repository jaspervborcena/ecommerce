// Models for external site integrations (WordPress, other sites)
// These represent Firestore documents used to store integration tokens
// and externally-sourced products/collections for later mapping/syncing.

export interface IntegrationToken {
  id?: string;
  tokenId: string; // public identifier for the token
  tokenHash: string; // hashed secret stored server-side (never store raw secret)
  companyId: string;
  storeId?: string;
  scopes: string[]; // e.g. ['products:write','collections:write']
  label?: string; // human-friendly name for the token
  createdBy?: string; // uid of the user who created the token
  createdAt?: string; // ISO timestamp
  expiresAt?: string | null; // ISO timestamp or null
  revoked?: boolean;
  lastUsedAt?: string | null; // ISO timestamp
}

export interface ExternalProductData {
  productName?: string;
  description?: string;
  skuId?: string;
  images?: string[];
  price?: number;
  currency?: string;
  inventory?: Array<{ sku?: string; quantity?: number }>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ExternalProduct {
  id?: string;
  sourceId: string; // id from external site (e.g., WP post id)
  sourceType: string; // 'wordpress', 'shopify', etc.
  companyId: string;
  storeId?: string;
  data: ExternalProductData;
  mappedProductId?: string | null; // internal `Product.id` if linked
  status?: 'pending' | 'synced' | 'failed' | 'draft';
  errorMessage?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
  syncedAt?: string | null; // ISO
}

export interface ExternalCollection {
  id?: string;
  sourceId: string;
  sourceType: string;
  companyId: string;
  storeId?: string;
  title?: string;
  productSourceIds?: string[]; // list of ExternalProduct.sourceId values
  mappedCollectionId?: string | null; // internal collection id if used
  status?: 'pending' | 'synced' | 'failed';
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Notes:
// - Token creation and secret generation must happen on a trusted server (Cloud Function)
//   and the secret should be returned once to the caller. Store only the hashed secret.
// - Firestore writes from external sites should be routed through a secure server
//   that validates token scope and rate-limits requests. Avoid allowing public writes
//   from client-side scripts directly to Firestore.

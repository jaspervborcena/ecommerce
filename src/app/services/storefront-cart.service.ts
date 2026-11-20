import { Injectable, computed, signal } from '@angular/core';

export interface StorefrontCartProduct {
  id: string;
  productName: string;
  sellingPrice: number;
  currency?: string;
  storeId?: string;
  imageUrl?: string;
}

export interface StorefrontCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  currency: string;
  imageUrl?: string;
}

export interface StorefrontCartSnapshot {
  items: StorefrontCartItem[];
  subtotal: number;
  total: number;
  storeId: string;
  branchId?: string;
  companyId?: string;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class StorefrontCartService {
  private readonly storageKey = 'tovrika-storefront-cart';
  private readonly cart = signal<StorefrontCartSnapshot>(this.loadCart());

  readonly items = computed(() => this.cart().items);
  readonly subtotal = computed(() => this.cart().subtotal);
  readonly total = computed(() => this.cart().total);
  readonly storeId = computed(() => this.cart().storeId);
  readonly currency = computed(() => this.cart().currency);
  readonly itemCount = computed(() => this.cart().items.reduce((sum, item) => sum + item.quantity, 0));

  getCartSnapshot(): StorefrontCartSnapshot {
    return this.cart();
  }

  setActiveStore(
    storeId: string,
    currency = 'PHP',
    branchId?: string | null,
    companyId?: string | null
  ): void {
    const normalizedStoreId = storeId?.trim();
    if (!normalizedStoreId) {
      return;
    }

    const current = this.cart();
    const activeBranchId = branchId === undefined
      ? current.storeId === normalizedStoreId ? current.branchId : undefined
      : branchId?.trim() || undefined;
    const activeCompanyId = companyId === undefined
      ? current.storeId === normalizedStoreId ? current.companyId : undefined
      : companyId?.trim() || undefined;
    const next = this.buildSnapshot(
      current.items,
      normalizedStoreId,
      currency || current.currency || 'PHP',
      activeBranchId,
      activeCompanyId
    );
    this.cart.set(next);
    this.persist(next);
  }

  addItem(product: StorefrontCartProduct, quantity = 1): void {
    const current = this.cart();
    const existing = current.items.find(item => item.productId === product.id);
    const nextItems = existing
      ? current.items.map(item => item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
          : item)
      : [...current.items, {
          productId: product.id,
          name: product.productName,
          price: product.sellingPrice,
          quantity,
          subtotal: product.sellingPrice * quantity,
          currency: product.currency || 'PHP',
          imageUrl: product.imageUrl
        }];

    const nextStore = product.storeId || current.storeId || 'demo-store';
    const nextCurrency = product.currency || current.currency || 'PHP';
    const nextBranchId = nextStore === current.storeId ? current.branchId : undefined;
    const nextCompanyId = nextStore === current.storeId ? current.companyId : undefined;
    const next = this.buildSnapshot(nextItems, nextStore, nextCurrency, nextBranchId, nextCompanyId);
    this.cart.set(next);
    this.persist(next);
  }

  removeItem(productId: string): void {
    const current = this.cart();
    const nextItems = current.items.filter(item => item.productId !== productId);
    const next = this.buildSnapshot(nextItems, current.storeId, current.currency, current.branchId, current.companyId);
    this.cart.set(next);
    this.persist(next);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const current = this.cart();
    const nextItems = current.items.map(item => item.productId === productId
      ? { ...item, quantity, subtotal: item.price * quantity }
      : item);
    const next = this.buildSnapshot(nextItems, current.storeId, current.currency, current.branchId, current.companyId);
    this.cart.set(next);
    this.persist(next);
  }

  clear(): void {
    const current = this.cart();
    const empty = this.buildSnapshot(
      [],
      current.storeId || 'demo-store',
      current.currency || 'PHP',
      current.branchId,
      current.companyId
    );
    this.cart.set(empty);
    this.persist(empty);
  }

  private buildSnapshot(
    items: StorefrontCartItem[],
    storeId: string,
    currency: string,
    branchId?: string,
    companyId?: string
  ): StorefrontCartSnapshot {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    return {
      items,
      subtotal,
      total: subtotal,
      storeId,
      ...(branchId ? { branchId } : {}),
      ...(companyId ? { companyId } : {}),
      currency
    };
  }

  private persist(cart: StorefrontCartSnapshot): void {
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
  }

  private loadCart(): StorefrontCartSnapshot {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return this.buildSnapshot([], 'demo-store', 'PHP');
      }
      const parsed = JSON.parse(raw) as StorefrontCartSnapshot;
      return this.buildSnapshot(
        parsed.items || [],
        parsed.storeId || 'demo-store',
        parsed.currency || 'PHP',
        typeof parsed.branchId === 'string' ? parsed.branchId : undefined,
        typeof parsed.companyId === 'string' ? parsed.companyId : undefined
      );
    } catch {
      return this.buildSnapshot([], 'demo-store', 'PHP');
    }
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, doc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { PublicStorefrontStore } from '../../services/storefront-publication.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-storefront-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [
    `.storefront-shell { max-width: 90rem; margin: 0 auto; padding: 0 1rem; }
    .storefront-grid { display: grid; grid-auto-rows: 1fr; gap: 1.25rem; }
    @media (min-width: 640px) { .storefront-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .storefront-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .storefront-card { display: flex; flex-direction: column; height: 100%; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 1.75rem; background: #ffffff; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06); transition: transform 0.25s ease, box-shadow 0.25s ease; text-decoration: none; }
    .storefront-card:hover { transform: translateY(-2px); box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
    .storefront-card > a { display: flex; flex: 1; min-height: 0; color: inherit; text-decoration: none; }
    .storefront-card-inner { display: grid; flex: 1; width: 100%; gap: 1rem; padding: 1.25rem; }
    .storefront-card-inner > div:last-child { display: flex; flex-direction: column; min-width: 0; }
    @media (min-width: 1024px) { .storefront-card-inner { grid-template-columns: 140px minmax(0, 1fr); align-items: stretch; } }
    .storefront-image-wrap { width: 100%; height: 160px; min-height: 160px; max-height: 160px; overflow: hidden; border-radius: 1.25rem; background: #f8fafc; }
    .storefront-image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .storefront-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #475569; margin-bottom: 0.75rem; }
    .storefront-title { font-size: 1.05rem; font-weight: 600; color: #0f172a; margin: 0; }
    .storefront-description { margin: 0.6rem 0 0; color: #475569; font-size: 0.92rem; line-height: 1.6; }
    .storefront-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .storefront-price { font-size: 1rem; font-weight: 700; color: #4338ca; }
    .storefront-sku { display: inline-flex; align-items: center; padding: 0.5rem 0.85rem; border-radius: 9999px; background: #f8fafc; color: #475569; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .storefront-action-bar { display: flex; align-items: center; gap: 0.75rem; }
    .storefront-pill { display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #dbe4f0; background: #ffffff; padding: 0.6rem 0.95rem; font-size: 0.9rem; font-weight: 600; color: #334155; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); text-decoration: none; }
    .storefront-pill.primary { background: #4338ca; color: #ffffff; border-color: #4338ca; }
    .storefront-card-action { margin-top: auto; }
    .storefront-add-btn { width: 100%; border: none; border-radius: 1rem; background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%); color: #ffffff; padding: 0.75rem 1rem; font-size: 0.95rem; font-weight: 700; box-shadow: 0 10px 24px rgba(79, 70, 229, 0.18); cursor: pointer; }
    .storefront-add-btn:hover { transform: translateY(-1px); }
    .storefront-feedback { margin-top: 0.75rem; border-radius: 1rem; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; padding: 0.75rem 0.9rem; font-size: 0.9rem; font-weight: 600; }
    `
  ],
  template: `
    <div class="storefront-shell">
      <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">{{ storeName() }}</h1>
          <p *ngIf="branchName()" class="mt-1 text-lg font-medium text-slate-700">{{ branchName() }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div *ngIf="isLoading()" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">Loading products...</div>
          <a *ngIf="canManageOrders()" routerLink="/store-orders" class="storefront-pill">Online orders</a>
          <a routerLink="/branches" class="storefront-pill">&larr; Back to branches</a>
        </div>
      </div>

      <div *ngIf="!isLoading() && products().length === 0" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
        No products found for this storefront.
      </div>

      <div class="mb-4 flex flex-wrap items-center justify-end gap-3">
        <div *ngIf="itemCount() > 0" class="rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold text-white">{{ itemCount() }} item(s)</div>
        <a routerLink="/cart" class="storefront-pill">View cart</a>
      </div>

      <div *ngIf="feedback()" class="storefront-feedback">{{ feedback() }}</div>

      <div class="storefront-grid">
        <div *ngFor="let p of products()" class="storefront-card">
          <a [routerLink]="['/product', p.id]" class="block">
            <div class="storefront-card-inner">
              <div class="storefront-image-wrap">
                <img [src]="p.imageUrl || 'assets/noimage.png'" alt="{{ p.productName }}" class="storefront-image" loading="lazy" />
              </div>
              <div>
                <div class="storefront-label">{{ p.category || 'Product' }}</div>
                <h3 class="storefront-title">{{ p.productName }}</h3>
                <p class="storefront-description">{{ p.shortDescription || p.description || 'No description available.' }}</p>
                <div class="storefront-footer">
                  <span class="storefront-price">{{ p.sellingPrice | currency:(p.currency || 'PHP') }}</span>
                  <span class="storefront-sku">{{ p.skuId || 'No SKU' }}</span>
                </div>
              </div>
            </div>
          </a>
          <div class="storefront-card-action px-5 pb-5">
            <button class="storefront-add-btn" (click)="addToCart(p)">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StorefrontListComponent {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private cartService = inject(StorefrontCartService);
  private authService = inject(AuthService);

  products = signal<any[]>([]);
  canManageOrders = computed(() =>
    ['creator', 'store_manager', 'manager', 'cashier', 'attendant'].includes(
      this.authService.getCurrentPermission()?.roleId || ''
    )
  );
  storeName = signal('Storefront');
  branchName = signal('');
  isLoading = signal<boolean>(true);
  feedback = signal<string>('');
  itemCount = this.cartService.itemCount;

  constructor() {
    void this.load();
  }

  private async load() {
    try {
      this.isLoading.set(true);
      const storeId = this.route.snapshot.paramMap.get('storeId') || '';
      await this.loadStoreDetails(storeId);
      const productsRef = collection(this.firestore, 'storefront_products');
      const q = query(productsRef, where('storeId', '==', storeId), where('status', '==', 'active'));
      const snap = await getDocs(q as any);
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...(d.data() as any) }));
      this.products.set(items);
    } catch (err) {
      console.error('Storefront load error', err);
      this.products.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadStoreDetails(storeId: string): Promise<void> {
    if (!storeId) {
      return;
    }

    try {
      const storeSnapshot = await getDoc(doc(this.firestore, 'storefront_stores', storeId));
      if (!storeSnapshot.exists()) {
        return;
      }

      const store = storeSnapshot.data() as Partial<PublicStorefrontStore>;
      if (store.status === 'active') {
        if (typeof store.storeName === 'string' && store.storeName.trim()) {
          this.storeName.set(store.storeName);
        }
        if (typeof store.branchName === 'string') {
          this.branchName.set(store.branchName);
        }
      }
    } catch (error) {
      console.error('Storefront store details load error', error);
    }
  }

  addToCart(product: any): void {
    this.cartService.addItem({
      id: product.id,
      productName: product.productName,
      sellingPrice: product.sellingPrice,
      currency: product.currency || 'PHP',
      storeId: product.storeId,
      imageUrl: product.imageUrl
    }, 1);
    this.feedback.set(`${product.productName} added to cart.`);
    window.setTimeout(() => this.feedback.set(''), 1600);
  }
}

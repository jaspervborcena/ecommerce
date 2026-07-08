import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-storefront-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="text-3xl font-semibold tracking-tight text-slate-900">Storefront</h2>
          <p class="mt-2 text-sm text-slate-500">Browse active products in a modern storefront layout optimized for discovery and conversion.</p>
        </div>
        <div *ngIf="isLoading()" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">Loading products...</div>
      </div>

      <div *ngIf="!isLoading() && products().length === 0" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
        No products found for this storefront.
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <a *ngFor="let p of products()" [routerLink]="['/product', p.id]" class="group block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div class="relative overflow-hidden bg-slate-100">
            <div class="h-64 max-h-64 overflow-hidden sm:h-52">
              <img *ngIf="p.imageUrl" [src]="p.imageUrl" alt="{{ p.productName }}" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
            </div>
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-100">{{ p.category || 'Product' }}</p>
            </div>
          </div>
          <div class="flex h-full flex-col justify-between gap-4 p-5">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">{{ p.productName }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">{{ p.shortDescription || p.description || 'No description available.' }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-left">
              <span class="text-lg font-semibold text-indigo-600">{{ p.sellingPrice | currency }}</span>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{{ p.skuId || 'No SKU' }}</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  `
})
export class StorefrontListComponent {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);

  products = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  constructor() {
    void this.load();
  }

  private async load() {
    try {
      this.isLoading.set(true);
      const storeId = this.route.snapshot.paramMap.get('storeId') || '';
      const productsRef = collection(this.firestore, 'products');
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
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-storefront-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div *ngIf="isLoading()" class="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600">Loading...</div>
      <div *ngIf="!isLoading() && !product()" class="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600">Product not found.</div>

      <div *ngIf="product()" class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
        <div class="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div class="overflow-hidden rounded-[28px] bg-slate-100">
            <img *ngIf="product().imageUrl" [src]="product().imageUrl" class="h-full w-full object-cover" loading="lazy" />
          </div>
          <div class="flex flex-col justify-between gap-6">
            <div>
              <div class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">Storefront</div>
              <h1 class="mt-4 text-3xl font-semibold text-slate-900">{{ product().productName }}</h1>
              <p class="mt-3 text-sm leading-7 text-slate-500">{{ product().shortDescription || product().description || 'No description available for this product.' }}</p>
            </div>
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-4">
                <span class="text-3xl font-bold text-indigo-600">{{ product().sellingPrice | currency }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">SKU: {{ product().skuId || '—' }}</span>
              </div>
              <button class="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StorefrontDetailComponent {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);

  product = signal<any | null>(null);
  isLoading = signal<boolean>(true);

  constructor() {
    void this.load();
  }

  private async load() {
    try {
      this.isLoading.set(true);
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.product.set(null);
        return;
      }
      const ref = doc(this.firestore, 'products', id as string);
      const snap = await getDoc(ref as any);
      if (!snap.exists()) {
        this.product.set(null);
      } else {
        this.product.set({ id: snap.id, ...(snap.data() as any) });
      }
    } catch (err) {
      console.error('Storefront detail load error', err);
      this.product.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }
}

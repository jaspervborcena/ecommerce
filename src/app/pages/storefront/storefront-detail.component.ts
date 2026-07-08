import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StorefrontCartService } from '../../services/storefront-cart.service';

@Component({
  selector: 'app-storefront-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [
    `.storefront-cta { display: inline-flex; width: 100%; align-items: center; justify-content: center; border-radius: 1rem; padding: 0.8rem 1.2rem; font-size: 0.95rem; font-weight: 700; border: 1px solid transparent; text-decoration: none; cursor: pointer; }
    .storefront-cta.primary { background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%); color: #ffffff; box-shadow: 0 10px 24px rgba(79, 70, 229, 0.18); }
    .storefront-cta.secondary { border-color: #cbd5e1; background: #ffffff; color: #334155; }
    .storefront-feedback { margin-top: 1rem; border-radius: 1rem; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; padding: 0.75rem 0.9rem; font-size: 0.9rem; font-weight: 600; }
    `
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div *ngIf="isLoading()" class="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600">Loading...</div>
      <div *ngIf="!isLoading() && !product()" class="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600">Product not found.</div>

      <div *ngIf="product()" class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
        <div class="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div class="overflow-hidden rounded-[28px] bg-slate-100">
            <img [src]="product().imageUrl || 'assets/noimage.png'" class="h-full w-full object-cover" loading="lazy" />
          </div>
          <div class="flex flex-col justify-between gap-6">
            <div>
              <div class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">Storefront</div>
              <h1 class="mt-4 text-3xl font-semibold text-slate-900">{{ product().productName }}</h1>
              <p class="mt-3 text-sm leading-7 text-slate-500">{{ product().shortDescription || product().description || 'No description available for this product.' }}</p>
            </div>
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-4">
                <span class="text-3xl font-bold text-indigo-600">{{ product().sellingPrice | currency:(product().currency || 'PHP') }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">SKU: {{ product().skuId || '—' }}</span>
              </div>
              <div class="flex flex-col gap-3 sm:flex-row">
                <button class="storefront-cta primary" (click)="addToCart()">Add to cart</button>
                <a routerLink="/cart" class="storefront-cta secondary">View cart</a>
              </div>
              <div *ngIf="feedback()" class="storefront-feedback">{{ feedback() }}</div>
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
  private cartService = inject(StorefrontCartService);

  product = signal<any | null>(null);
  isLoading = signal<boolean>(true);
  feedback = signal<string>('');

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

  addToCart(): void {
    const current = this.product();
    if (!current) {
      return;
    }

    this.cartService.addItem({
      id: current.id,
      productName: current.productName,
      sellingPrice: current.sellingPrice,
      currency: current.currency || 'PHP',
      storeId: current.storeId,
      imageUrl: current.imageUrl
    }, 1);
    this.feedback.set(`${current.productName} added to cart.`);
    window.setTimeout(() => this.feedback.set(''), 1800);
  }
}

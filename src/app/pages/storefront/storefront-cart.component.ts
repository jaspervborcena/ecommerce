import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StorefrontCartService } from '../../services/storefront-cart.service';

@Component({
  selector: 'app-storefront-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [
    `.storefront-cart-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; padding: 0.75rem 1rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease; }
    .storefront-cart-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08); }
    .storefront-cart-btn.primary { background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%); border-color: #4338ca; color: #ffffff; }
    .storefront-cart-card { border-radius: 1.75rem; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05); }
    .storefront-item { display: flex; flex-direction: column; gap: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.25rem; }
    .storefront-item:last-child { border-bottom: none; padding-bottom: 0; }
    .storefront-item-main { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
    .storefront-item-image { width: 96px; height: 96px; border-radius: 1.25rem; object-fit: cover; }
    .storefront-item-meta { flex: 1 1 240px; min-width: 180px; }
    .storefront-item-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; }
    .storefront-item-price { color: #475569; font-size: 0.95rem; }
    .storefront-item-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .storefront-qty-btn { display: inline-flex; height: 2.3rem; width: 2.3rem; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: background-color 0.2s ease; }
    .storefront-qty-btn:hover { background: #f8fafc; }
    .storefront-remove-btn { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 9999px; border: 1px solid #fca5a5; background: #fee2e2; color: #b91c1c; padding: 0.55rem 0.85rem; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: background-color 0.2s ease; }
    .storefront-remove-btn:hover { background: #fecaca; }
    .storefront-line-total { font-weight: 700; color: #0f172a; }
    .storefront-summary { border-radius: 1.75rem; border: 1px solid #e2e8f0; background: #f8fafc; padding: 1.5rem; }
    .storefront-summary-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .storefront-summary-row { display: flex; justify-content: space-between; gap: 1rem; color: #475569; }
    .storefront-summary-total { font-size: 1.05rem; font-weight: 700; color: #111827; }
    .storefront-back-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
    .storefront-back-label { color: #475569; font-size: 0.95rem; }
    `
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
        <div class="storefront-back-row">
          <div>
            <h2 class="text-2xl font-semibold text-slate-900">Your Cart</h2>
            <p class="mt-2 text-sm text-slate-500">Review your selected items before checkout.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <a [routerLink]="['/store', storeId()]" class="storefront-cart-btn"><span>&larr;</span>&nbsp;Back to products</a>
            <span class="storefront-back-label">{{ items().length }} item(s) · {{ itemCount() }} total quantity</span>
          </div>
        </div>

        <div *ngIf="items().length === 0" class="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
          Your cart is empty.
        </div>

        <div *ngIf="items().length > 0" class="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          <div class="storefront-cart-card p-6">
            <div class="space-y-6">
              <div *ngFor="let item of items()" class="storefront-item">
                <div class="storefront-item-main">
                  <img [src]="item.imageUrl || 'assets/noimage.png'" class="storefront-item-image" alt="{{ item.name }}" />
                  <div class="storefront-item-meta">
                    <div class="storefront-item-title">{{ item.name }}</div>
                    <div class="storefront-item-price">{{ item.price | currency:(item.currency || 'PHP') }} each</div>
                    <div class="storefront-item-price mt-1 text-sm text-slate-500">Line total: <span class="storefront-line-total">{{ item.subtotal | currency:(item.currency || 'PHP') }}</span></div>
                  </div>
                </div>
                <div class="storefront-item-actions">
                  <button class="storefront-qty-btn" (click)="decrease(item.productId)">−</button>
                  <div class="min-w-[2.5rem] text-center rounded-full border border-slate-200 bg-slate-50 py-2 text-sm font-semibold text-slate-700">{{ item.quantity }}</div>
                  <button class="storefront-qty-btn" (click)="increase(item.productId)">+</button>
                  <button class="storefront-remove-btn" (click)="remove(item.productId)">
                    <span aria-hidden="true">✕</span> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="storefront-summary">
            <div class="storefront-summary-title">Order summary</div>
            <div class="mt-6 space-y-4">
              <div class="storefront-summary-row"><span>Subtotal</span><span>{{ subtotal() | currency:(currency() || 'PHP') }}</span></div>
              <div class="storefront-summary-row"><span>Shipping</span><span>Free</span></div>
              <div class="storefront-summary-row"><span>Taxes</span><span>Calculated at checkout</span></div>
              <div class="storefront-summary-row storefront-summary-total"><span>Total</span><span>{{ total() | currency:(currency() || 'PHP') }}</span></div>
            </div>
            <a routerLink="/checkout" class="storefront-cart-btn primary mt-8 w-full">Proceed to Checkout</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StorefrontCartComponent {
  private cartService = inject(StorefrontCartService);
  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly total = this.cartService.total;
  readonly currency = this.cartService.currency;
  readonly storeId = this.cartService.storeId;
  readonly itemCount = this.cartService.itemCount;

  increase(productId: string): void {
    const current = this.cartService.getCartSnapshot().items.find(item => item.productId === productId);
    if (current) {
      this.cartService.updateQuantity(productId, current.quantity + 1);
    }
  }

  decrease(productId: string): void {
    const current = this.cartService.getCartSnapshot().items.find(item => item.productId === productId);
    if (current && current.quantity > 1) {
      this.cartService.updateQuantity(productId, current.quantity - 1);
    }
  }

  remove(productId: string): void {
    this.cartService.removeItem(productId);
  }
}

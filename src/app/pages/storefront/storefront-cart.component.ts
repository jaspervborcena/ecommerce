import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StorefrontCartService } from '../../services/storefront-cart.service';

@Component({
  selector: 'app-storefront-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [
    `.storefront-cart-shell, .storefront-cart-shell * { box-sizing: border-box; }
    .storefront-cart-shell { max-width: 1200px; margin: 0 auto; padding: 2rem 1.25rem; }
    .storefront-cart-panel { border-radius: 1.75rem; border: 1px solid #e2e8f0; background: #ffffff; padding: 2rem; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05); }
    .storefront-cart-title { margin: 0; color: #0f172a; font-size: 1.5rem; line-height: 1.25; font-weight: 700; }
    .storefront-cart-subtitle { margin: 0.5rem 0 0; color: #64748b; font-size: 0.95rem; }
    .storefront-cart-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; padding: 0.75rem 1rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease; }
    .storefront-cart-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08); }
    .storefront-cart-btn.primary { background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%); border-color: #4338ca; color: #ffffff; }
    .storefront-back-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
    .storefront-header-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 0.75rem; }
    .storefront-back-label { color: #475569; font-size: 0.95rem; }
    .storefront-empty { margin-top: 2rem; border: 1px dashed #cbd5e1; border-radius: 1.5rem; background: #f8fafc; padding: 2.5rem; color: #475569; text-align: center; }
    .storefront-cart-layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 0.8fr); align-items: start; gap: 1.5rem; margin-top: 2rem; }
    .storefront-cart-card { border-radius: 1.75rem; border: 1px solid #e2e8f0; background: #ffffff; padding: 1.5rem; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05); }
    .storefront-cart-items { display: grid; gap: 1.25rem; }
    .storefront-item { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.25rem; }
    .storefront-item:last-child { border-bottom: none; padding-bottom: 0; }
    .storefront-item-main { display: flex; flex: 1 1 auto; min-width: 0; gap: 1rem; align-items: center; }
    .storefront-item-image { flex: 0 0 96px; width: 96px; height: 96px; border-radius: 1.25rem; object-fit: cover; }
    .storefront-item-meta { flex: 1 1 auto; min-width: 0; }
    .storefront-item-title { margin-bottom: 0.35rem; color: #0f172a; font-size: 1rem; font-weight: 700; }
    .storefront-item-price { color: #475569; font-size: 0.95rem; }
    .storefront-item-actions { display: flex; flex: 0 0 auto; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .storefront-qty-btn { display: inline-flex; height: 2.3rem; width: 2.3rem; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: background-color 0.2s ease; }
    .storefront-qty-btn:hover { background: #f8fafc; }
    .storefront-quantity { min-width: 2.5rem; border: 1px solid #e2e8f0; border-radius: 9999px; background: #f8fafc; padding: 0.5rem; color: #334155; font-size: 0.875rem; font-weight: 600; text-align: center; }
    .storefront-remove-btn { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 9999px; border: 1px solid #fca5a5; background: #fee2e2; color: #b91c1c; padding: 0.55rem 0.85rem; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: background-color 0.2s ease; }
    .storefront-remove-btn:hover { background: #fecaca; }
    .storefront-line-total { font-weight: 700; color: #0f172a; }
    .storefront-summary { border-radius: 1.75rem; border: 1px solid #e2e8f0; background: #f8fafc; padding: 1.5rem; }
    .storefront-summary-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .storefront-summary-body { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
    .storefront-summary-row { display: flex; justify-content: space-between; gap: 1rem; color: #475569; }
    .storefront-summary-total { font-size: 1.05rem; font-weight: 700; color: #111827; }
    .storefront-checkout-btn { width: 100%; margin-top: 2rem; }
    @media (max-width: 900px) { .storefront-cart-layout { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 600px) {
      .storefront-cart-shell { padding: 1rem 0.75rem; }
      .storefront-cart-panel { padding: 1.25rem; }
      .storefront-back-row { align-items: flex-start; }
      .storefront-header-actions { width: 100%; justify-content: space-between; }
      .storefront-item { align-items: flex-start; flex-direction: column; }
      .storefront-item-actions { padding-left: 0; }
      .storefront-cart-card, .storefront-summary { padding: 1rem; }
    }
    `
  ],
  template: `
    <div class="storefront-cart-shell">
      <div class="storefront-cart-panel">
        <div class="storefront-back-row">
          <div>
            <h1 class="storefront-cart-title">Your Cart</h1>
            <p class="storefront-cart-subtitle">Review your selected items before checkout.</p>
          </div>
          <div class="storefront-header-actions">
            <a [routerLink]="['/store', storeId()]" class="storefront-cart-btn"><span>&larr;</span>&nbsp;Back to products</a>
            <span class="storefront-back-label">{{ items().length }} item(s) · {{ itemCount() }} total quantity</span>
          </div>
        </div>

        <div *ngIf="items().length === 0" class="storefront-empty">
          Your cart is empty.
        </div>

        <div *ngIf="items().length > 0" class="storefront-cart-layout">
          <div class="storefront-cart-card">
            <div class="storefront-cart-items">
              <div *ngFor="let item of items()" class="storefront-item">
                <div class="storefront-item-main">
                  <img [src]="item.imageUrl || 'assets/noimage.png'" class="storefront-item-image" alt="{{ item.name }}" />
                  <div class="storefront-item-meta">
                    <div class="storefront-item-title">{{ item.name }}</div>
                    <div class="storefront-item-price">{{ item.price | currency:(item.currency || 'PHP') }} each</div>
                    <div class="storefront-item-price">Line total: <span class="storefront-line-total">{{ item.subtotal | currency:(item.currency || 'PHP') }}</span></div>
                  </div>
                </div>
                <div class="storefront-item-actions">
                  <button class="storefront-qty-btn" (click)="decrease(item.productId)">−</button>
                  <div class="storefront-quantity">{{ item.quantity }}</div>
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
            <div class="storefront-summary-body">
              <div class="storefront-summary-row"><span>Subtotal</span><span>{{ subtotal() | currency:(currency() || 'PHP') }}</span></div>
              <div class="storefront-summary-row"><span>Shipping</span><span>Free</span></div>
              <div class="storefront-summary-row"><span>Taxes</span><span>Calculated at checkout</span></div>
              <div class="storefront-summary-row storefront-summary-total"><span>Total</span><span>{{ total() | currency:(currency() || 'PHP') }}</span></div>
            </div>
            <a routerLink="/checkout" class="storefront-cart-btn primary storefront-checkout-btn">Proceed to Checkout</a>
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

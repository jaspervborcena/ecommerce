import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { StorefrontCartService } from '../../services/storefront-cart.service';

@Component({
  selector: 'app-storefront-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [
    `.storefront-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 1rem; padding: 0.8rem 0.95rem; font-size: 0.95rem; color: #0f172a; background: #ffffff; }
    .storefront-input:focus { outline: 2px solid rgba(79, 70, 229, 0.2); border-color: #4f46e5; }
    .storefront-submit { width: 100%; border: none; border-radius: 1rem; background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%); color: #ffffff; padding: 0.85rem 1rem; font-size: 0.95rem; font-weight: 700; box-shadow: 0 10px 24px rgba(79, 70, 229, 0.18); cursor: pointer; }
    .storefront-submit:disabled { opacity: 0.7; cursor: progress; }
    `
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
        <h2 class="text-2xl font-semibold text-slate-900">Checkout</h2>
        <p class="mt-2 text-sm text-slate-500">Sign in or create an account to complete your order.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-slate-700">Customer name</label>
              <input formControlName="customerName" class="storefront-input mt-2" placeholder="Juan Dela Cruz" />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">Email</label>
              <input formControlName="email" type="email" class="storefront-input mt-2" placeholder="juan@example.com" />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">Notes</label>
              <textarea formControlName="notes" rows="4" class="storefront-input mt-2" placeholder="Delivery instructions"></textarea>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 class="text-lg font-semibold text-slate-900">Order Summary</h3>
            <div class="mt-4 space-y-3 text-sm text-slate-600">
              <div *ngFor="let item of items()" class="flex justify-between gap-3">
                <span>{{ item.name }} × {{ item.quantity }}</span>
                <span>{{ item.subtotal | currency:(item.currency || 'PHP') }}</span>
              </div>
            </div>
            <div class="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-700">
              <div class="flex justify-between"><span>Subtotal</span><span>{{ subtotal() | currency:(currency() || 'PHP') }}</span></div>
              <div class="mt-2 flex justify-between font-semibold text-slate-900"><span>Total</span><span>{{ total() | currency:(currency() || 'PHP') }}</span></div>
            </div>
            <button type="submit" class="storefront-submit mt-6" [disabled]="isSubmitting() || items().length === 0">{{ isSubmitting() ? 'Placing order...' : 'Place Order' }}</button>
            <p *ngIf="message()" class="mt-3 text-sm font-medium" [class.text-emerald-600]="isSuccess()" [class.text-rose-600]="!isSuccess()">{{ message() }}</p>
          </div>
        </form>
      </div>
    </div>
  `
})
export class StorefrontCheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(StorefrontCartService);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly total = this.cartService.total;
  readonly currency = this.cartService.currency;
  readonly isSubmitting = signal(false);
  readonly message = signal('');
  readonly isSuccess = signal(false);

  readonly form = this.fb.group({
    customerName: [this.authService.currentUser()?.displayName || '', Validators.required],
    email: [this.authService.currentUser()?.email || '', [Validators.required, Validators.email]],
    notes: ['']
  });

  async submit(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      this.message.set('Create an account or sign in before completing checkout.');
      this.isSuccess.set(false);
      return;
    }

    if (this.form.invalid || this.items().length === 0) {
      this.message.set('Please complete the form and add at least one item.');
      this.isSuccess.set(false);
      return;
    }

    this.isSubmitting.set(true);
    this.message.set('');

    try {
      const snapshot = this.cartService.getCartSnapshot();
      const order = {
        uid: user.uid,
        createdAt: new Date(),
        customerName: this.form.value.customerName,
        email: this.form.value.email,
        notes: this.form.value.notes || '',
        items: snapshot.items,
        subtotal: snapshot.subtotal,
        total: snapshot.total,
        currency: snapshot.currency,
        storeId: snapshot.storeId,
        roleId: 'customer',
        status: 'REQUEST'
      };

      await addDoc(collection(this.firestore, 'storefront_orders'), order as any);
      this.cartService.clear();
      this.message.set('Your order request was sent to the store.');
      this.isSuccess.set(true);
      this.form.reset();
      window.setTimeout(() => this.router.navigate(['/store/' + snapshot.storeId]), 700);
    } catch (err) {
      console.error('Firestore order submission failed.', err);
      this.message.set('Could not place the order. Your cart is unchanged; please try again.');
      this.isSuccess.set(false);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

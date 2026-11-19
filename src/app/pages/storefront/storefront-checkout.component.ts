import { AfterViewInit, Component, computed, inject, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { Store } from '../../interfaces/store.interface';
import { environment } from '../../../environments/environment';

interface Coordinates {
  lat: number;
  lng: number;
}

interface DeliveryQuote {
  quotationId: string;
  expiresAt: string | null;
  serviceType: string;
  fee: number;
  currency: string;
  receivedAt: number;
}

interface CheckoutReviewSnapshot {
  customerName: string;
  phoneNumber: string;
  shippingDetails: {
    fullName: string;
    contactNumber: string;
    address: string;
    houseNumber: string;
    street: string;
    barangay: string;
    city: string;
    province: string;
    postalCode: string;
  };
  shipFrom: {
    storeName: string;
    branchName: string;
    phoneNumber: string;
    address: string;
  };
  items: Array<{ name: string; quantity: number; subtotal: number; currency?: string }>;
  subtotal: number;
  deliveryFee: number;
  deliveryQuoteId: string | null;
  includeDeliveryFee: boolean;
  total: number;
  currency: string;
}

@Component({
  selector: 'app-storefront-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [
    `:host { display: block; min-height: 100vh; background: #f5f7fb; color: #172033; }
    .checkout-shell { box-sizing: border-box; width: min(100% - 2rem, 1080px); margin: 0 auto; padding: 3.5rem 0 5rem; }
    .checkout-heading { margin-bottom: 1.75rem; }
    .checkout-eyebrow { margin: 0 0 0.55rem; color: #5145cd; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    .checkout-title { margin: 0; color: #111827; font-size: clamp(1.8rem, 4vw, 2.25rem); font-weight: 700; letter-spacing: -0.04em; line-height: 1.2; }
    .checkout-description { margin: 0.65rem 0 0; color: #647084; font-size: 0.98rem; line-height: 1.6; }
    .checkout-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr); gap: 1.5rem; align-items: start; }
    .checkout-details { display: grid; gap: 1.25rem; }
    .checkout-card { min-width: 0; border: 1px solid #e3e8f1; border-radius: 1.25rem; background: #fff; box-shadow: 0 8px 28px rgba(28, 39, 64, 0.05); }
    .customer-card { padding: clamp(1.25rem, 3vw, 2rem); }
    .shipping-card { padding: clamp(1.25rem, 3vw, 2rem); }
    .section-title { margin: 0; color: #172033; font-size: 1.1rem; font-weight: 650; letter-spacing: -0.02em; }
    .section-description { margin: 0.35rem 0 1.5rem; color: #758095; font-size: 0.88rem; line-height: 1.5; }
    .shipping-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .shipping-toggle { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 0.35rem; border: 0; border-radius: 999px; background: #f3f2ff; padding: 0.48rem 0.68rem; color: #5145cd; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .shipping-toggle:focus-visible { outline: 3px solid rgba(101, 88, 220, 0.24); outline-offset: 2px; }
    .shipping-toggle-icon { display: inline-block; font-size: 0.9rem; transition: transform 150ms ease; }
    .shipping-toggle-icon.expanded { transform: rotate(180deg); }
    .shipping-summary { margin: 0 0 1.25rem; border-radius: 0.65rem; background: #f8fafc; padding: 0.85rem; color: #536075; font-size: 0.88rem; line-height: 1.55; }
    .shipping-summary-name { color: #172033; font-weight: 700; }
    .ship-from-details { margin-top: 1.2rem; border-radius: 0.75rem; background: #f8fafc; padding: 1rem; }
    .ship-from-title { margin: 0 0 0.65rem; color: #172033; font-size: 0.9rem; font-weight: 700; }
    .ship-from-line { margin: 0.3rem 0 0; color: #536075; font-size: 0.86rem; line-height: 1.5; }
    .ship-from-label { color: #374151; font-weight: 600; }
    .shipping-contact-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.15rem; }
    .address-autocomplete { position: relative; z-index: 30; }
    .address-suggestions { position: absolute; z-index: 1000; top: calc(100% + 0.25rem); left: 0; right: 0; max-height: 16rem; overflow-y: auto; border: 1px solid #d6dce7; border-radius: 0.65rem; background: #fff; box-shadow: 0 8px 24px rgba(28, 39, 64, 0.14); pointer-events: auto; }
    .address-suggestion { position: relative; z-index: 1001; display: block; width: 100%; border: 0; border-bottom: 1px solid #edf0f5; background: #fff; padding: 0.75rem 0.85rem; color: #172033; font: inherit; text-align: left; cursor: pointer; pointer-events: auto; }
    .address-suggestion:last-child { border-bottom: 0; }
    .address-suggestion:hover, .address-suggestion:focus-visible { background: #f5f7fb; outline: none; }
    .field-list { display: grid; gap: 1.2rem; }
    .shipping-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .field-wide { grid-column: 1 / -1; }
    .address-status { margin: 0.45rem 0 0; color: #64748b; font-size: 0.78rem; line-height: 1.4; }
    .address-status.error { color: #b91c1c; }
    .field-label { display: block; margin-bottom: 0.45rem; color: #374151; font-size: 0.87rem; font-weight: 600; }
    .field-optional { color: #8791a1; font-weight: 400; }
    .storefront-input { box-sizing: border-box; display: block; width: 100%; min-height: 2.9rem; border: 1px solid #d6dce7; border-radius: 0.65rem; padding: 0.75rem 0.85rem; color: #172033; background: #fff; font: inherit; font-size: 0.93rem; transition: border-color 150ms ease, box-shadow 150ms ease; }
    .storefront-input::placeholder { color: #9aa3b2; }
    .storefront-input:focus { outline: none; border-color: #6558dc; box-shadow: 0 0 0 3px rgba(101, 88, 220, 0.14); }
    textarea.storefront-input { min-height: 7rem; resize: vertical; }
    .summary-card { padding: 1.5rem; }
    .summary-title { margin: 0; color: #172033; font-size: 1.1rem; font-weight: 650; letter-spacing: -0.02em; }
    .summary-items { display: grid; gap: 1rem; margin-top: 1.4rem; }
    .summary-item { display: flex; justify-content: space-between; gap: 1rem; color: #536075; font-size: 0.9rem; line-height: 1.45; }
    .summary-item-name { min-width: 0; }
    .summary-item-price { flex: 0 0 auto; color: #263248; font-weight: 600; }
    .summary-totals { display: grid; gap: 0.7rem; margin-top: 1.4rem; border-top: 1px solid #e8ebf1; padding-top: 1.2rem; }
    .summary-total { display: flex; justify-content: space-between; gap: 1rem; color: #647084; font-size: 0.9rem; }
    .summary-grand-total { color: #172033; font-size: 1rem; font-weight: 700; }
    .payment-note { margin: 1rem 0 0; border-radius: 0.65rem; background: #f3f2ff; padding: 0.8rem 0.9rem; color: #5145cd; font-size: 0.84rem; font-weight: 600; }
    .payment-note.error { background: #fff1f2; color: #b91c1c; }
    .quote-retry { margin-left: 0.4rem; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
    .payment-option { display: flex; align-items: flex-start; gap: 0.55rem; margin-top: 1rem; color: #374151; font-size: 0.88rem; line-height: 1.45; cursor: pointer; }
    .payment-option input { width: 1rem; height: 1rem; margin-top: 0.15rem; accent-color: #5145cd; }
    .payment-option:has(input:disabled) { opacity: 0.55; cursor: not-allowed; }
    .storefront-submit { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 3.1rem; margin-top: 1.5rem; border: 0; border-radius: 0.7rem; background: #5145cd; color: #fff; font: inherit; font-size: 0.95rem; font-weight: 650; cursor: pointer; box-shadow: 0 5px 12px rgba(81, 69, 205, 0.2); transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease; }
    .storefront-submit:hover:not(:disabled) { transform: translateY(-1px); background: #4338b8; box-shadow: 0 7px 16px rgba(81, 69, 205, 0.25); }
    .storefront-submit:focus-visible { outline: 3px solid rgba(101, 88, 220, 0.28); outline-offset: 3px; }
    .storefront-submit:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
    .checkout-message { margin: 1rem 0 0; font-size: 0.88rem; line-height: 1.5; }
    .review-layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr); gap: 1.5rem; align-items: start; }
    .review-details { display: grid; gap: 1rem; }
    .review-card { padding: clamp(1.25rem, 3vw, 2rem); }
    .review-card-title { margin: 0 0 0.85rem; color: #172033; font-size: 1rem; font-weight: 700; }
    .review-line { margin: 0.35rem 0 0; color: #536075; font-size: 0.9rem; line-height: 1.5; overflow-wrap: anywhere; }
    .review-line strong { color: #263248; }
    .review-items { display: grid; gap: 0.75rem; margin-top: 1rem; }
    .maya-payment { margin-top: 1.25rem; border-radius: 0.85rem; background: #f8fafc; padding: 1rem; text-align: center; }
    .maya-qr-placeholder { display: grid; place-content: center; gap: 0.45rem; width: min(100%, 220px); aspect-ratio: 1; margin: 1rem auto; border: 2px dashed #9aa3b2; border-radius: 0.75rem; background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 12px, #eef1f6 12px, #eef1f6 24px); color: #374151; }
    .maya-qr-placeholder strong { color: #5145cd; font-size: 1.3rem; letter-spacing: 0.08em; }
    .maya-qr-placeholder span { font-size: 0.85rem; font-weight: 800; letter-spacing: 0.08em; }
    .maya-qr-placeholder small { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; }
    .maya-payment-status { margin: 0.75rem 0 0; color: #92400e; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; }
    .review-actions { display: grid; gap: 0.75rem; margin-top: 1.25rem; }
    .review-back-button { min-height: 2.8rem; border: 1px solid #d6dce7; border-radius: 0.7rem; background: #fff; color: #374151; font: inherit; font-weight: 650; cursor: pointer; }
    .review-back-button:focus-visible { outline: 3px solid rgba(101, 88, 220, 0.24); outline-offset: 2px; }
    .review-payment-button { min-height: 2.8rem; border: 0; border-radius: 0.7rem; background: #a3a3b2; color: #fff; font: inherit; font-weight: 700; cursor: not-allowed; }
    @media (max-width: 720px) {
      .checkout-shell { width: min(100% - 1.25rem, 560px); padding: 2rem 0 3rem; }
      .checkout-grid { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
      .review-layout { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
      .summary-card { padding: 1.25rem; }
    }
    @media (max-width: 480px) {
      .shipping-fields { grid-template-columns: minmax(0, 1fr); }
      .shipping-contact-fields { grid-template-columns: minmax(0, 1fr); }
      .field-wide { grid-column: auto; }
    }`
  ],
  template: `
    <main class="checkout-shell">
      <header class="checkout-heading">
        <p class="checkout-eyebrow">Your order</p>
        <h1 class="checkout-title">{{ checkoutStage() === 'details' ? 'Checkout' : 'Review your order' }}</h1>
        <p class="checkout-description">
          {{ checkoutStage() === 'details'
            ? 'Review your order and add your details before continuing.'
            : 'Confirm your locked order details before Maya payment.' }}
        </p>
      </header>

      @if (checkoutStage() === 'details') {
      <form [formGroup]="form" (ngSubmit)="submit()" class="checkout-grid">
        <div class="checkout-details">
          <section class="checkout-card shipping-card" formGroupName="shippingDetails" aria-labelledby="shipping-details-title">
            <div class="shipping-header">
              <div>
                <h2 id="shipping-details-title" class="section-title">Ship to address</h2>
                <p class="section-description">Where should we deliver your order?</p>
              </div>
              <button type="button" class="shipping-toggle" (click)="toggleShippingAddress()" [attr.aria-expanded]="isShippingAddressExpanded()" aria-controls="shipping-address-fields">
                {{ isShippingAddressExpanded() ? 'Collapse' : 'Expand' }}
                <span class="shipping-toggle-icon" [class.expanded]="isShippingAddressExpanded()" aria-hidden="true">&#9662;</span>
              </button>
            </div>
            @if (!isShippingAddressExpanded()) {
              <div class="shipping-summary">
                <div class="shipping-summary-name">{{ form.controls.shippingDetails.controls.fullName.value || 'Recipient' }}</div>
                {{ form.controls.shippingDetails.controls.houseNumber.value }}
                {{ form.controls.shippingDetails.controls.street.value }},
                {{ form.controls.shippingDetails.controls.barangay.value }},
                {{ form.controls.shippingDetails.controls.city.value }},
                {{ form.controls.shippingDetails.controls.province.value }}
                {{ form.controls.shippingDetails.controls.postalCode.value }}
              </div>
            }
            <div class="shipping-contact-fields">
              <div>
                <label for="shipping-full-name" class="field-label">Full name</label>
                <input id="shipping-full-name" formControlName="fullName" class="storefront-input" autocomplete="shipping name" placeholder="Jasper Borcena" />
              </div>
              <div>
                <label for="shipping-contact-number" class="field-label">Contact number</label>
                <input id="shipping-contact-number" formControlName="contactNumber" type="tel" class="storefront-input" autocomplete="tel" placeholder="09123456789" (input)="syncCustomerPhone($event)" />
              </div>
              <div class="field-wide">
                <label for="shipping-address" class="field-label">Address</label>
                <div class="address-autocomplete">
                  <input id="shipping-address" formControlName="address" class="storefront-input" autocomplete="off" placeholder="Start typing your address" (input)="onAddressInput($event)" (blur)="onAddressBlur()" />
                  @if (addressSuggestions().length) {
                    <div class="address-suggestions" role="listbox" aria-label="Address suggestions">
                      @for (suggestion of addressSuggestions(); track $index) {
                        <button type="button" class="address-suggestion" role="option"
                          (pointerdown)="onAddressSuggestionPointerDown($event, suggestion)"
                          (click)="selectAddressSuggestion(suggestion)"
                          (keydown.enter)="selectAddressSuggestion(suggestion); $event.preventDefault()"
                          (keydown.space)="selectAddressSuggestion(suggestion); $event.preventDefault()">
                          {{ suggestion.label }}
                        </button>
                      }
                    </div>
                  }
                </div>
                @if (addressAutocompleteStatus()) {
                  <p class="address-status" [class.error]="addressAutocompleteStatus().startsWith('Address search unavailable') || addressAutocompleteStatus().startsWith('Google address search failed')">{{ addressAutocompleteStatus() }}</p>
                }
              </div>
            </div>
            @if (isShippingAddressExpanded()) {
            <div id="shipping-address-fields" class="shipping-fields">
              <div>
                <label for="shipping-house-number" class="field-label">House / unit number</label>
                <input id="shipping-house-number" formControlName="houseNumber" class="storefront-input" autocomplete="shipping address-line2" placeholder="Unit 101" />
              </div>
              <div>
                <label for="shipping-street" class="field-label">Street</label>
                <input id="shipping-street" formControlName="street" class="storefront-input" autocomplete="shipping address-line1" placeholder="Main Street" />
              </div>
              <div>
                <label for="shipping-barangay" class="field-label">Barangay</label>
                <input id="shipping-barangay" formControlName="barangay" class="storefront-input" placeholder="San Isidro" />
              </div>
              <div>
                <label for="shipping-city" class="field-label">City / municipality</label>
                <input id="shipping-city" formControlName="city" class="storefront-input" autocomplete="shipping address-level2" placeholder="Mandaluyong" />
              </div>
              <div>
                <label for="shipping-province" class="field-label">Province / region</label>
                <input id="shipping-province" formControlName="province" class="storefront-input" autocomplete="shipping address-level1" placeholder="Metro Manila" />
              </div>
              <div>
                <label for="shipping-postal-code" class="field-label">Postal code</label>
                <input id="shipping-postal-code" formControlName="postalCode" class="storefront-input" autocomplete="shipping postal-code" placeholder="1550" />
              </div>
            </div>
            }
            @if (shippingAddressProvided()) {
              <div class="ship-from-details" aria-live="polite">
                <h3 class="ship-from-title">Ship from</h3>
                @if (storeDetailsLoading()) {
                  <p class="ship-from-line">Loading store pickup details...</p>
                } @else if (storeDetails()) {
                  <p class="ship-from-line">
                    <span class="ship-from-label">Store:</span> {{ storeDetails()?.storeName }}
                  </p>
                  <p class="ship-from-line">
                    <span class="ship-from-label">Branch:</span> {{ storeDetails()?.branchName }}
                  </p>
                  <p class="ship-from-line">
                    <span class="ship-from-label">Contact:</span> {{ storeDetails()?.phoneNumber }}
                  </p>
                  <p class="ship-from-line">
                    <span class="ship-from-label">Pickup address:</span> {{ storeDetails()?.address }}
                  </p>
                } @else {
                  <p class="ship-from-line" role="status">{{ storeDetailsError() }}</p>
                }
              </div>
            }
          </section>

          <section class="checkout-card customer-card" aria-labelledby="customer-details-title">
            <h2 id="customer-details-title" class="section-title">Customer details</h2>
            <p class="section-description">Your account contact information.</p>
            <div class="field-list">
              <div>
                <label for="customer-name" class="field-label">Customer name</label>
                <input id="customer-name" formControlName="customerName" class="storefront-input" autocomplete="name" readonly />
              </div>
              <div>
                <label for="customer-phone" class="field-label">Phone number</label>
                <input id="customer-phone" formControlName="phoneNumber" type="tel" class="storefront-input" autocomplete="tel" readonly />
              </div>
            </div>
          </section>
        </div>

        <aside class="checkout-card summary-card" aria-labelledby="order-summary-title">
            <h2 id="order-summary-title" class="summary-title">Order summary</h2>
            <div class="summary-items">
              <div *ngFor="let item of items()" class="summary-item">
                <span class="summary-item-name">{{ item.name }} × {{ item.quantity }}</span>
                <span class="summary-item-price">{{ item.subtotal | currency:(item.currency || 'PHP') }}</span>
              </div>
            </div>
            <div class="summary-totals">
              <div class="summary-total"><span>Subtotal</span><span>{{ subtotal() | currency:(currency() || 'PHP') }}</span></div>
              @if (deliveryQuoteLoading()) {
                <div class="summary-total"><span>Lalamove delivery fee</span><span>Calculating...</span></div>
              } @else if (deliveryQuoteValid()) {
                <div class="summary-total">
                  <span>Lalamove delivery fee</span>
                  <span>{{ deliveryFee() | currency:(deliveryQuote()?.currency || 'PHP') }}</span>
                </div>
              }
              <div class="summary-total summary-grand-total"><span>Total</span><span>{{ orderTotal() | currency:(currency() || 'PHP') }}</span></div>
            </div>
            <label class="payment-option">
              <input type="checkbox" [checked]="includeDeliveryFeeInPayment()" (change)="toggleDeliveryFeePayment($event)" />
              <span>Include delivery fee in payment</span>
            </label>
            <p class="payment-note" [class.error]="deliveryQuoteError()" role="status" aria-live="polite">
              @if (!shippingAddressProvided()) {
                Enter a ship-to address to get a Lalamove quote. You can check this box first.
              } @else if (deliveryQuoteLoading()) {
                Getting your Lalamove Motorcycle quote...
              } @else if (deliveryQuoteError()) {
                {{ deliveryQuoteError() }}
                @if (includeDeliveryFeeInPayment()) {
                  <button type="button" class="quote-retry" (click)="requestLalamoveQuote()">Retry</button>
                }
              } @else if (deliveryQuoteExpired()) {
                The Lalamove quote expired. Get a fresh quote before placing your order.
                @if (includeDeliveryFeeInPayment()) {
                  <button type="button" class="quote-retry" (click)="requestLalamoveQuote()">Get new quote</button>
                }
              } @else if (deliveryQuoteValid() && includeDeliveryFeeInPayment()) {
                Lalamove delivery fee is included in payment.
              } @else if (deliveryQuoteValid()) {
                Lalamove delivery fee will be paid upon arrival.
              } @else if (includeDeliveryFeeInPayment()) {
                Select a suggested address or finish entering it to calculate the Lalamove quote.
              } @else {
                Check this box to calculate the Lalamove delivery fee.
              }
            </p>
            <button type="submit" class="storefront-submit" [disabled]="isSubmitting() || items().length === 0 || (includeDeliveryFeeInPayment() && (!deliveryQuoteValid() || deliveryQuoteLoading()))">{{ isSubmitting() ? 'Preparing review...' : 'Review order' }}</button>
            <p *ngIf="message()" class="checkout-message" [class.text-emerald-600]="isSuccess()" [class.text-rose-600]="!isSuccess()" role="status" aria-live="polite">{{ message() }}</p>
        </aside>
      </form>
      } @else {
        <section *ngIf="reviewSnapshot() as review" class="review-layout" aria-label="Order review">
          <div class="review-details">
            <section class="checkout-card review-card">
              <h2 class="review-card-title">Customer details</h2>
              <p class="review-line"><strong>Name:</strong> {{ review.customerName }}</p>
              <p class="review-line"><strong>Phone:</strong> {{ review.phoneNumber }}</p>
            </section>

            <section class="checkout-card review-card">
              <h2 class="review-card-title">Ship to</h2>
              <p class="review-line"><strong>Recipient:</strong> {{ review.shippingDetails.fullName }}</p>
              <p class="review-line"><strong>Contact:</strong> {{ review.shippingDetails.contactNumber }}</p>
              <p class="review-line"><strong>Address:</strong> {{ review.shippingDetails.address }}</p>
              <p class="review-line">
                <strong>Address details:</strong>
                {{ review.shippingDetails.houseNumber }}, {{ review.shippingDetails.street }},
                {{ review.shippingDetails.barangay }}, {{ review.shippingDetails.city }},
                {{ review.shippingDetails.province }} {{ review.shippingDetails.postalCode }}
              </p>
            </section>

            <section class="checkout-card review-card">
              <h2 class="review-card-title">Ship from</h2>
              <p class="review-line"><strong>Store:</strong> {{ review.shipFrom.storeName }}</p>
              <p class="review-line"><strong>Branch:</strong> {{ review.shipFrom.branchName }}</p>
              <p class="review-line"><strong>Contact:</strong> {{ review.shipFrom.phoneNumber }}</p>
              <p class="review-line"><strong>Pickup address:</strong> {{ review.shipFrom.address }}</p>
            </section>
          </div>

          <aside class="checkout-card summary-card">
            <h2 class="summary-title">Order summary</h2>
            <div class="review-items">
              @for (item of review.items; track $index) {
                <div class="summary-item">
                  <span class="summary-item-name">{{ item.name }} × {{ item.quantity }}</span>
                  <span class="summary-item-price">{{ item.subtotal | currency:(item.currency || review.currency) }}</span>
                </div>
              }
            </div>
            <div class="summary-totals">
              <div class="summary-total"><span>Subtotal</span><span>{{ review.subtotal | currency:review.currency }}</span></div>
              @if (review.deliveryQuoteId) {
                <div class="summary-total"><span>Lalamove delivery fee</span><span>{{ review.deliveryFee | currency:review.currency }}</span></div>
              } @else if (!review.includeDeliveryFee) {
                <div class="summary-total"><span>Delivery fee</span><span>Pay upon arrival</span></div>
              }
              <div class="summary-total summary-grand-total"><span>Total</span><span>{{ review.total | currency:review.currency }}</span></div>
            </div>

            <section class="maya-payment" aria-labelledby="maya-payment-title">
              <h3 id="maya-payment-title" class="review-card-title">Pay with Maya</h3>
              <p class="review-line">Amount due: <strong>{{ review.total | currency:review.currency }}</strong></p>
              <div class="maya-qr-placeholder" aria-label="Maya QR placeholder. Not scannable.">
                <strong>MAYA</strong>
                <span>QR PLACEHOLDER</span>
                <small>NOT SCANNABLE</small>
              </div>
              <p class="review-line">
                Maya checkout and webhook verification are not configured yet. This placeholder cannot accept payment.
              </p>
              <p class="maya-payment-status">ORDER NOT SUBMITTED — A VERIFIED PAYMENT IS REQUIRED</p>
            </section>

            <div class="review-actions">
              <button type="button" class="review-back-button" (click)="backToCheckout()">Back to edit details</button>
              <button type="button" class="review-payment-button" disabled>Maya payment setup required</button>
            </div>
          </aside>
        </section>
      }
    </main>
  `
})
export class StorefrontCheckoutComponent implements AfterViewInit, OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly firebaseAuth = inject(Auth);
  private readonly ngZone = inject(NgZone);
  private readonly cartService = inject(StorefrontCartService);
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly currency = this.cartService.currency;
  readonly deliveryQuote = signal<DeliveryQuote | null>(null);
  readonly deliveryQuoteLoading = signal(false);
  readonly deliveryQuoteError = signal('');
  readonly deliveryFee = computed(() => this.deliveryQuote()?.fee || 0);
  readonly deliveryQuoteExpired = signal(false);
  readonly deliveryQuoteValid = computed(() => !!this.deliveryQuote() && !this.deliveryQuoteExpired());
  readonly includeDeliveryFeeInPayment = signal(false);
  readonly shippingAddressProvided = signal(false);
  readonly orderTotal = computed(() =>
    this.subtotal() + (this.includeDeliveryFeeInPayment() && this.deliveryQuoteValid() ? this.deliveryFee() : 0)
  );
  readonly isSubmitting = signal(false);
  readonly message = signal('');
  readonly isSuccess = signal(false);
  readonly checkoutStage = signal<'details' | 'review'>('details');
  readonly reviewSnapshot = signal<CheckoutReviewSnapshot | null>(null);
  readonly isShippingAddressExpanded = signal(true);
  readonly addressAutocompleteStatus = signal('');
  readonly addressSuggestions = signal<any[]>([]);
  readonly storeDetails = signal<Pick<Store, 'storeName' | 'branchName' | 'address' | 'phoneNumber'> | null>(null);
  readonly storeDetailsLoading = signal(true);
  readonly storeDetailsError = signal('');
  readonly destinationCoordinates = signal<Coordinates | null>(null);
  private googleMaps: any;
  private placesLibrary: any;
  private autocompleteSessionToken: any;
  private addressSearchTimer?: number;
  private addressSearchSequence = 0;
  private addressSelectionInProgress = false;
  private selectedAddressText = '';
  private pickupCoordinates: Coordinates | null = null;
  private storeDetailsLoadPromise?: Promise<void>;
  private quoteRequestSequence = 0;
  private quotedRouteKey = '';
  private quoteExpiryTimer?: number;

  readonly form = this.fb.group({
    shippingDetails: this.fb.group({
      fullName: [this.authService.currentUser()?.displayName || '', Validators.required],
      contactNumber: ['', Validators.required],
      address: ['', Validators.required],
      houseNumber: ['', Validators.required],
      street: ['', Validators.required],
      barangay: ['', Validators.required],
      city: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required]
    }),
    customerName: [this.authService.currentUser()?.displayName || '', Validators.required],
    phoneNumber: ['', Validators.required]
  });

  ngOnInit(): void {
    void this.loadStoreDetails();
  }

  ngOnDestroy(): void {
    if (this.addressSearchTimer !== undefined) {
      window.clearTimeout(this.addressSearchTimer);
    }
    if (this.quoteExpiryTimer !== undefined) {
      window.clearTimeout(this.quoteExpiryTimer);
    }
  }

  toggleShippingAddress(): void {
    this.isShippingAddressExpanded.update(expanded => !expanded);
  }

  syncCustomerPhone(event: Event): void {
    const phoneNumber = (event.target as HTMLInputElement).value;
    this.form.controls.phoneNumber.setValue(phoneNumber);
  }

  toggleDeliveryFeePayment(event: Event): void {
    const shouldInclude = (event.target as HTMLInputElement).checked;
    this.includeDeliveryFeeInPayment.set(shouldInclude);
    if (shouldInclude) {
      void this.requestLalamoveQuote();
    } else {
      this.deliveryQuoteError.set('');
    }
  }

  ngAfterViewInit(): void {
    this.loadGooglePlaces();
  }

  private loadStoreDetails(): Promise<void> {
    if (!this.storeDetailsLoadPromise) {
      this.storeDetailsLoadPromise = this.fetchStoreDetails();
    }
    return this.storeDetailsLoadPromise;
  }

  private async fetchStoreDetails(): Promise<void> {
    const storeId = this.cartService.getCartSnapshot().storeId;
    if (!storeId) {
      this.storeDetailsError.set('Store details could not be found. Return to the storefront and try again.');
      this.storeDetailsLoading.set(false);
      return;
    }

    try {
      const storeSnapshot = await getDoc(doc(this.firestore, 'stores', storeId));
      if (!storeSnapshot.exists()) {
        this.storeDetailsError.set('Store details could not be found. Return to the storefront and try again.');
        return;
      }

      const store = storeSnapshot.data() as Partial<Store>;
      if (!store.storeName || !store.branchName || !store.address || !store.phoneNumber) {
        this.storeDetailsError.set('The store pickup details are incomplete. Please contact the store.');
        return;
      }

      this.storeDetails.set({
        storeName: store.storeName,
        branchName: store.branchName,
        address: store.address,
        phoneNumber: store.phoneNumber
      });
    } catch (error) {
      console.error('Failed to load store pickup details for checkout.', error);
      this.storeDetailsError.set('Could not load the store pickup details. Please try again.');
    } finally {
      this.storeDetailsLoading.set(false);
    }
  }

  onAddressInput(event: Event): void {
    const address = (event.target as HTMLInputElement).value;
    this.form.controls.shippingDetails.controls.address.setValue(address);
    this.shippingAddressProvided.set(address.trim().length > 0);
    this.destinationCoordinates.set(null);
    this.deliveryQuote.set(null);
    this.deliveryQuoteExpired.set(false);
    if (this.quoteExpiryTimer !== undefined) {
      window.clearTimeout(this.quoteExpiryTimer);
      this.quoteExpiryTimer = undefined;
    }
    this.deliveryQuoteError.set('');
    this.deliveryQuoteLoading.set(false);
    this.quoteRequestSequence++;
    this.quotedRouteKey = '';
    this.addressSuggestions.set([]);
    this.selectedAddressText = '';
    this.addressSearchSequence++;

    if (!address.trim()) {
      this.addressAutocompleteStatus.set('');
      return;
    }

    if (address.trim().length < 3) {
      this.addressAutocompleteStatus.set('Type at least 3 characters to search for an address.');
      return;
    }

    this.addressAutocompleteStatus.set('Searching addresses...');
    if (this.addressSearchTimer !== undefined) {
      window.clearTimeout(this.addressSearchTimer);
    }
    this.addressSearchTimer = window.setTimeout(() => {
      void this.fetchAddressSuggestions(address.trim());
    }, 250);
  }

  onAddressBlur(): void {
    window.setTimeout(() => {
      if (this.addressSelectionInProgress) {
        return;
      }
      const address = this.form.controls.shippingDetails.controls.address.value?.trim() || '';
      if (address && address !== this.selectedAddressText) {
        void this.geocodeTypedAddress(address, this.googleMaps);
      }
    }, 200);
  }

  onAddressSuggestionPointerDown(event: PointerEvent, suggestion: any): void {
    event.preventDefault();
    void this.selectAddressSuggestion(suggestion);
  }

  async selectAddressSuggestion(suggestion: any): Promise<void> {
    const prediction = suggestion?.placePrediction;
    if (!prediction || !this.googleMaps || this.addressSelectionInProgress) {
      return;
    }

    this.addressSelectionInProgress = true;
    if (this.addressSearchTimer !== undefined) {
      window.clearTimeout(this.addressSearchTimer);
    }
    this.addressSearchSequence++;
    this.addressSuggestions.set([]);
    this.addressAutocompleteStatus.set('Loading address details...');
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location'] });
      const components = place.addressComponents || [];
      const coordinates = this.coordinatesFromLocation(place.location);
      const getComponent = (...types: string[]): string => {
        const component = types
          .map(type => components.find((item: any) => item.types?.includes(type)))
          .find(Boolean);
        return component?.longText || '';
      };
      const barangay = getComponent(
        'sublocality_level_1',
        'administrative_area_level_4',
        'sublocality',
        'neighborhood',
        'sublocality_level_2',
        'sublocality_level_3',
        'sublocality_level_4',
        'sublocality_level_5',
        'administrative_area_level_5',
        'administrative_area_level_3'
      ) || await this.lookupBarangay(place.location, this.googleMaps);
      const formattedAddress = place.formattedAddress || prediction.text?.toString() || '';

      this.ngZone.run(() => {
        this.form.controls.shippingDetails.patchValue({
          address: formattedAddress,
          houseNumber: getComponent('street_number'),
          street: getComponent('route'),
          barangay,
          city: getComponent('locality', 'administrative_area_level_2'),
          province: getComponent('administrative_area_level_1'),
          postalCode: getComponent('postal_code')
        });
        this.destinationCoordinates.set(coordinates);
        this.shippingAddressProvided.set(formattedAddress.trim().length > 0);
        this.selectedAddressText = formattedAddress.trim();
        this.addressAutocompleteStatus.set(
          barangay ? '' : 'Address found, but Google did not return a barangay. Please enter it manually.'
        );
      });
      this.autocompleteSessionToken = new this.placesLibrary.AutocompleteSessionToken();
      if (coordinates) {
        void this.requestLalamoveQuote();
      } else {
        await this.geocodeTypedAddress(formattedAddress, this.googleMaps);
      }
    } catch (error) {
      console.error('Google Places address selection failed.', error);
      this.ngZone.run(() => {
        this.addressAutocompleteStatus.set('Address search unavailable. Please try selecting the address again.');
      });
    } finally {
      this.addressSelectionInProgress = false;
    }
  }

  private loadGooglePlaces(): void {
    this.addressAutocompleteStatus.set('Loading address suggestions...');
    const initialize = async (): Promise<void> => {
      const googleMaps = (window as any).google?.maps;
      if (!googleMaps?.importLibrary) {
        this.addressAutocompleteStatus.set('Address search unavailable. Google Places could not be initialized.');
        return;
      }
      this.googleMaps = googleMaps;
      try {
        this.placesLibrary = await googleMaps.importLibrary('places');
        this.autocompleteSessionToken = new this.placesLibrary.AutocompleteSessionToken();
        this.ngZone.run(() => this.addressAutocompleteStatus.set('Type an address and select a suggestion.'));
      } catch (error) {
        console.error('Google Places library could not be loaded.', error);
        this.ngZone.run(() => {
          this.addressAutocompleteStatus.set('Address search unavailable. Check the Maps and Places API key settings.');
        });
      }
    };

    if ((window as any).google?.maps) {
      void initialize();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-places]');
    if (existingScript) {
      existingScript.addEventListener('load', () => void initialize(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-google-maps-places', 'true');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMaps.apiKey}&libraries=places&loading=async&callback=initGooglePlacesCheckout`;
    script.async = true;
    script.onerror = () => {
      this.addressAutocompleteStatus.set('Address search unavailable. Check the Google Maps API key and network connection.');
    };
    (window as any).initGooglePlacesCheckout = () => void initialize();
    document.head.appendChild(script);
  }

  private async fetchAddressSuggestions(input: string): Promise<void> {
    if (!this.placesLibrary?.AutocompleteSuggestion || !this.autocompleteSessionToken) {
      this.addressAutocompleteStatus.set('Address search is still loading. Try again in a moment.');
      return;
    }

    const requestSequence = this.addressSearchSequence;
    try {
      const { suggestions } = await this.placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ['ph'],
        sessionToken: this.autocompleteSessionToken
      });
      if (requestSequence !== this.addressSearchSequence) {
        return;
      }

      const matchingSuggestions = (suggestions || [])
        .filter((item: any) => item.placePrediction)
        .map((item: any) => ({
          ...item,
          label: item.placePrediction.text?.toString() || ''
        }))
        .filter((item: any) => item.label);
      this.ngZone.run(() => {
        this.addressSuggestions.set(matchingSuggestions);
        this.addressAutocompleteStatus.set(
          matchingSuggestions.length ? 'Select an address suggestion to fill in the address details.' : 'No address suggestions found.'
        );
      });
    } catch (error) {
      console.error('Google Places address suggestions failed.', error);
      this.ngZone.run(() => {
        this.addressSuggestions.set([]);
        this.addressAutocompleteStatus.set('Google address search failed. Check the Maps and Places API key settings.');
      });
    }
  }

  async requestLalamoveQuote(): Promise<void> {
    if (!this.includeDeliveryFeeInPayment() || !this.shippingAddressProvided() || this.deliveryQuoteLoading()) {
      return;
    }

    const destinationCoordinates = this.destinationCoordinates();
    if (!destinationCoordinates) {
      this.deliveryQuoteError.set('Select a suggested address or finish entering the address to get a Lalamove quote.');
      return;
    }

    const requestSequence = ++this.quoteRequestSequence;
    this.deliveryQuoteLoading.set(true);
    this.deliveryQuoteError.set('');

    try {
      await this.loadStoreDetails();
      const store = this.storeDetails();
      const storeId = this.cartService.getCartSnapshot().storeId;
      if (!store || !storeId) {
        throw new Error(this.storeDetailsError() || 'Store pickup details are unavailable.');
      }

      const pickupCoordinates = await this.resolvePickupCoordinates(store.address);
      if (requestSequence !== this.quoteRequestSequence) {
        return;
      }

      const routeKey = [
        storeId,
        pickupCoordinates.lat.toFixed(5),
        pickupCoordinates.lng.toFixed(5),
        destinationCoordinates.lat.toFixed(5),
        destinationCoordinates.lng.toFixed(5)
      ].join(':');
      const currentQuote = this.deliveryQuote();
      if (currentQuote && this.quotedRouteKey === routeKey && this.deliveryQuoteValid()) {
        return;
      }

      const firebaseUser = this.firebaseAuth.currentUser;
      if (!firebaseUser) {
        throw new Error('Sign in before requesting a delivery quote.');
      }

      const token = await firebaseUser.getIdToken();
      const response = await fetch(environment.api.lalamoveQuoteApi, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId,
          pickupCoordinates,
          destination: {
            address: this.form.controls.shippingDetails.controls.address.value?.trim() || '',
            coordinates: destinationCoordinates
          }
        })
      });
      const responseBody = await response.json() as { quote?: Omit<DeliveryQuote, 'receivedAt'>; error?: string };
      if (!response.ok) {
        throw new Error(responseBody.error || 'Could not retrieve a Lalamove delivery quote.');
      }
      if (!responseBody.quote ||
          !responseBody.quote.quotationId ||
          !Number.isFinite(responseBody.quote.fee) ||
          !responseBody.quote.currency) {
        throw new Error('Lalamove returned an invalid delivery quote.');
      }
      if (requestSequence !== this.quoteRequestSequence) {
        return;
      }

      const quote: DeliveryQuote = { ...responseBody.quote, receivedAt: Date.now() };
      this.deliveryQuote.set(quote);
      this.deliveryQuoteExpired.set(false);
      this.quotedRouteKey = routeKey;
      if (this.quoteExpiryTimer !== undefined) {
        window.clearTimeout(this.quoteExpiryTimer);
      }
      const expiry = quote.expiresAt ? Date.parse(quote.expiresAt) : Number.NaN;
      const expiryTime = Number.isFinite(expiry) ? expiry : quote.receivedAt + 4 * 60 * 1000;
      this.quoteExpiryTimer = window.setTimeout(
        () => this.deliveryQuoteExpired.set(true),
        Math.max(0, expiryTime - Date.now())
      );
    } catch (error) {
      if (requestSequence !== this.quoteRequestSequence) {
        return;
      }
      console.error('Lalamove sandbox delivery quote failed.', error);
      this.deliveryQuoteError.set(error instanceof Error
        ? error.message
        : 'Could not retrieve a Lalamove delivery quote. Please try again.');
    } finally {
      if (requestSequence === this.quoteRequestSequence) {
        this.deliveryQuoteLoading.set(false);
      }
    }
  }

  private coordinatesFromLocation(location: any): Coordinates | null {
    const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
    const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return { lat, lng };
  }

  private async resolvePickupCoordinates(address: string): Promise<Coordinates> {
    if (this.pickupCoordinates) {
      return this.pickupCoordinates;
    }
    if (!this.googleMaps?.Geocoder) {
      throw new Error('Google Maps could not locate the store. Check the Maps API key restrictions and Geocoding API.');
    }

    return new Promise((resolve, reject) => {
      new this.googleMaps.Geocoder().geocode(
        { address, componentRestrictions: { country: 'PH' } },
        (results: any[], status: string) => {
          const coordinates = this.coordinatesFromLocation(results?.[0]?.geometry?.location);
          if (status !== 'OK' || !coordinates) {
            reject(new Error('Google could not resolve the store pickup address. Check the store address and Maps API configuration.'));
            return;
          }
          this.pickupCoordinates = coordinates;
          resolve(coordinates);
        }
      );
    });
  }

  private geocodeTypedAddress(address: string, googleMaps: any): Promise<boolean> {
    if (!googleMaps?.Geocoder) {
      return Promise.resolve(false);
    }

    this.ngZone.run(() => this.addressAutocompleteStatus.set('Looking up address details...'));
    return new Promise(resolve => {
      new googleMaps.Geocoder().geocode(
        { address, componentRestrictions: { country: 'PH' } },
        async (results: any[], status: string) => {
          const result = results?.[0];
          if (status !== 'OK' || !result) {
            console.warn('Google could not resolve the entered checkout address.', status);
            this.ngZone.run(() => {
              this.addressAutocompleteStatus.set('Google could not find this address. Select a suggestion or enter the address parts manually.');
            });
            resolve(false);
            return;
          }

          try {
            const components = result.address_components || [];
            const getComponent = (...types: string[]): string => {
              const component = types
                .map(type => components.find((item: any) => item.types?.includes(type)))
                .find(Boolean);
              return component?.long_name || '';
            };
            const location = result.geometry?.location;
            const coordinates = this.coordinatesFromLocation(location);
            if (!coordinates) {
              this.ngZone.run(() => {
                this.addressAutocompleteStatus.set('Google found the address but could not resolve its map location.');
              });
              resolve(false);
              return;
            }
            const barangay = getComponent(
              'sublocality_level_1',
              'administrative_area_level_4',
              'sublocality',
              'neighborhood',
              'sublocality_level_2',
              'sublocality_level_3',
              'sublocality_level_4',
              'sublocality_level_5',
              'administrative_area_level_5',
              'administrative_area_level_3'
            ) || await this.lookupBarangay(location, googleMaps);

            this.ngZone.run(() => {
              this.form.controls.shippingDetails.patchValue({
                address: result.formatted_address || address,
                houseNumber: getComponent('street_number'),
                street: getComponent('route'),
                barangay,
                city: getComponent('locality', 'administrative_area_level_2'),
                province: getComponent('administrative_area_level_1'),
                postalCode: getComponent('postal_code')
              });
              this.destinationCoordinates.set(coordinates);
              this.shippingAddressProvided.set(true);
              this.addressAutocompleteStatus.set(
                barangay ? '' : 'Address found, but Google did not return a barangay. Please enter it manually.'
              );
            });
            if (this.includeDeliveryFeeInPayment()) {
              void this.requestLalamoveQuote();
            }
            resolve(true);
          } catch (error) {
            console.error('Google geocoding for the entered checkout address failed.', error);
            this.ngZone.run(() => {
              this.addressAutocompleteStatus.set('Address details could not be loaded. Please enter them manually.');
            });
            resolve(false);
          }
        }
      );
    });
  }

  private lookupBarangay(location: any, googleMaps: any): Promise<string> {
    if (!location || !googleMaps.Geocoder) {
      return Promise.resolve('');
    }

    return new Promise(resolve => {
      new googleMaps.Geocoder().geocode({ location }, (results: any[], status: string) => {
        if (status !== 'OK' || !results?.length) {
          console.warn('Google reverse geocoding did not return address details for the selected place.', status);
          resolve('');
          return;
        }

        const components = results.flatMap((result: any) => result.address_components || []);
        const barangayTypes = [
          'sublocality_level_1',
          'administrative_area_level_4',
          'sublocality',
          'neighborhood',
          'sublocality_level_2',
          'sublocality_level_3',
          'sublocality_level_4',
          'sublocality_level_5',
          'administrative_area_level_5',
          'administrative_area_level_3'
        ];
        const component = barangayTypes
          .map(type => components.find((item: any) => item.types?.includes(type)))
          .find(Boolean);
        resolve(component?.long_name || '');
      });
    });
  }

  async submit(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      this.message.set('Create an account or sign in before completing checkout.');
      this.isSuccess.set(false);
      return;
    }

    if (this.items().length === 0) {
      this.message.set('Your cart is empty. Add at least one item before continuing.');
      this.isSuccess.set(false);
      return;
    }

    const shippingDetails = this.form.controls.shippingDetails.getRawValue();
    if (!this.form.controls.customerName.value?.trim()) {
      this.form.controls.customerName.setValue(shippingDetails.fullName?.trim() || '');
    }
    if (!this.form.controls.phoneNumber.value?.trim()) {
      this.form.controls.phoneNumber.setValue(shippingDetails.contactNumber?.trim() || '');
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set(`Please fill in the required fields: ${this.getMissingRequiredFieldLabels().join(', ')}.`);
      this.isSuccess.set(false);
      return;
    }

    if (this.includeDeliveryFeeInPayment() && !this.deliveryQuoteValid()) {
      this.message.set('Get a valid Lalamove delivery quote before including the delivery fee in payment.');
      this.isSuccess.set(false);
      return;
    }

    this.isSubmitting.set(true);
    this.message.set('');

    try {
      const snapshot = this.cartService.getCartSnapshot();
      const storeSnapshot = await getDoc(doc(this.firestore, 'stores', snapshot.storeId));
      if (!storeSnapshot.exists()) {
        this.message.set('Store details could not be found. Please return to the storefront and try again.');
        this.isSuccess.set(false);
        return;
      }

      const store = storeSnapshot.data() as Partial<Store>;
      if (!store.storeName || !store.branchName || !store.address || !store.phoneNumber) {
        this.message.set('The store shipping details are incomplete. Please contact the store before continuing.');
        this.isSuccess.set(false);
        return;
      }

      const deliveryQuote = this.deliveryQuoteValid() ? this.deliveryQuote() : null;
      const includeDeliveryFee = this.includeDeliveryFeeInPayment();
      const deliveryFee = deliveryQuote?.fee || 0;
      this.reviewSnapshot.set({
        customerName: this.form.controls.customerName.value?.trim() || '',
        phoneNumber: this.form.controls.phoneNumber.value?.trim() || '',
        shippingDetails: {
          fullName: shippingDetails.fullName?.trim() || '',
          contactNumber: shippingDetails.contactNumber?.trim() || '',
          address: shippingDetails.address?.trim() || '',
          houseNumber: shippingDetails.houseNumber?.trim() || '',
          street: shippingDetails.street?.trim() || '',
          barangay: shippingDetails.barangay?.trim() || '',
          city: shippingDetails.city?.trim() || '',
          province: shippingDetails.province?.trim() || '',
          postalCode: shippingDetails.postalCode?.trim() || ''
        },
        shipFrom: {
          storeName: store.storeName,
          branchName: store.branchName,
          phoneNumber: store.phoneNumber,
          address: store.address
        },
        items: snapshot.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          subtotal: item.subtotal,
          currency: item.currency
        })),
        subtotal: snapshot.subtotal,
        deliveryFee,
        deliveryQuoteId: deliveryQuote?.quotationId || null,
        includeDeliveryFee,
        total: snapshot.subtotal + (includeDeliveryFee ? deliveryFee : 0),
        currency: includeDeliveryFee ? deliveryQuote?.currency || snapshot.currency : snapshot.currency
      });
      this.form.disable();
      this.checkoutStage.set('review');
      this.message.set('');
      this.isSuccess.set(false);
    } catch (err) {
      console.error('Could not prepare the storefront checkout review.', err);
      this.message.set('Could not prepare the order review. Your cart is unchanged; please try again.');
      this.isSuccess.set(false);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  backToCheckout(): void {
    this.form.enable();
    this.reviewSnapshot.set(null);
    this.checkoutStage.set('details');
  }

  private getMissingRequiredFieldLabels(): string[] {
    const shipping = this.form.controls.shippingDetails.controls;
    return [
      { label: 'Customer name', missing: this.form.controls.customerName.invalid },
      { label: 'Customer phone number', missing: this.form.controls.phoneNumber.invalid },
      { label: 'Recipient full name', missing: shipping.fullName.invalid },
      { label: 'Recipient contact number', missing: shipping.contactNumber.invalid },
      { label: 'Address', missing: shipping.address.invalid },
      { label: 'House / unit number', missing: shipping.houseNumber.invalid },
      { label: 'Street', missing: shipping.street.invalid },
      { label: 'Barangay', missing: shipping.barangay.invalid },
      { label: 'City / municipality', missing: shipping.city.invalid },
      { label: 'Province / region', missing: shipping.province.invalid },
      { label: 'Postal code', missing: shipping.postalCode.invalid }
    ].filter(field => field.missing).map(field => field.label);
  }
}

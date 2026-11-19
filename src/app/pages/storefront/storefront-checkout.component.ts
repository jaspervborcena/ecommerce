import { AfterViewInit, Component, computed, inject, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, addDoc, collection, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { Store } from '../../interfaces/store.interface';
import { environment } from '../../../environments/environment';

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
    .payment-option { display: flex; align-items: flex-start; gap: 0.55rem; margin-top: 1rem; color: #374151; font-size: 0.88rem; line-height: 1.45; cursor: pointer; }
    .payment-option input { width: 1rem; height: 1rem; margin-top: 0.15rem; accent-color: #5145cd; }
    .payment-option:has(input:disabled) { opacity: 0.55; cursor: not-allowed; }
    .storefront-submit { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 3.1rem; margin-top: 1.5rem; border: 0; border-radius: 0.7rem; background: #5145cd; color: #fff; font: inherit; font-size: 0.95rem; font-weight: 650; cursor: pointer; box-shadow: 0 5px 12px rgba(81, 69, 205, 0.2); transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease; }
    .storefront-submit:hover:not(:disabled) { transform: translateY(-1px); background: #4338b8; box-shadow: 0 7px 16px rgba(81, 69, 205, 0.25); }
    .storefront-submit:focus-visible { outline: 3px solid rgba(101, 88, 220, 0.28); outline-offset: 3px; }
    .storefront-submit:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
    .checkout-message { margin: 1rem 0 0; font-size: 0.88rem; line-height: 1.5; }
    @media (max-width: 720px) {
      .checkout-shell { width: min(100% - 1.25rem, 560px); padding: 2rem 0 3rem; }
      .checkout-grid { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
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
        <h1 class="checkout-title">Checkout</h1>
        <p class="checkout-description">Review your order and add your details to complete your purchase.</p>
      </header>

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
                          (mousedown)="$event.preventDefault()"
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
              <div class="summary-total summary-grand-total"><span>Total</span><span>{{ orderTotal() | currency:(currency() || 'PHP') }}</span></div>
            </div>
            <label class="payment-option">
              <input type="checkbox" [checked]="includeDeliveryFeeInPayment()" [disabled]="!shippingAddressProvided()" (change)="toggleDeliveryFeePayment($event)" />
              <span>Include delivery fee in payment</span>
            </label>
            <p class="payment-note">
              @if (!shippingAddressProvided()) {
                Enter an address to calculate the delivery fee with a quotation.
              } @else if (includeDeliveryFeeInPayment()) {
                Delivery fee is included in payment. It remains ₱0.00 until a delivery quotation is available.
              } @else {
                Delivery fee is unpaid and will be paid upon arrival when a delivery quotation is available.
              }
            </p>
            <button type="submit" class="storefront-submit" [disabled]="isSubmitting() || items().length === 0">{{ isSubmitting() ? 'Placing order...' : 'Place Order' }}</button>
            <p *ngIf="message()" class="checkout-message" [class.text-emerald-600]="isSuccess()" [class.text-rose-600]="!isSuccess()" role="status" aria-live="polite">{{ message() }}</p>
        </aside>
      </form>
    </main>
  `
})
export class StorefrontCheckoutComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly ngZone = inject(NgZone);
  private readonly cartService = inject(StorefrontCartService);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly currency = this.cartService.currency;
  readonly deliveryFee = 0;
  readonly includeDeliveryFeeInPayment = signal(false);
  readonly shippingAddressProvided = signal(false);
  readonly orderTotal = computed(() => this.subtotal());
  readonly isSubmitting = signal(false);
  readonly message = signal('');
  readonly isSuccess = signal(false);
  readonly isShippingAddressExpanded = signal(true);
  readonly addressAutocompleteStatus = signal('');
  readonly addressSuggestions = signal<any[]>([]);
  private googleMaps: any;
  private placesLibrary: any;
  private autocompleteSessionToken: any;
  private addressSearchTimer?: number;
  private addressSearchSequence = 0;
  private selectedAddressText = '';

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

  toggleShippingAddress(): void {
    this.isShippingAddressExpanded.update(expanded => !expanded);
  }

  syncCustomerPhone(event: Event): void {
    const phoneNumber = (event.target as HTMLInputElement).value;
    this.form.controls.phoneNumber.setValue(phoneNumber);
  }

  toggleDeliveryFeePayment(event: Event): void {
    if (!this.shippingAddressProvided()) {
      this.includeDeliveryFeeInPayment.set(false);
      return;
    }
    this.includeDeliveryFeeInPayment.set((event.target as HTMLInputElement).checked);
  }

  ngAfterViewInit(): void {
    this.loadGooglePlaces();
  }

  onAddressInput(event: Event): void {
    const address = (event.target as HTMLInputElement).value;
    this.form.controls.shippingDetails.controls.address.setValue(address);
    this.shippingAddressProvided.set(address.trim().length > 0);
    this.addressSuggestions.set([]);
    this.selectedAddressText = '';
    this.addressSearchSequence++;

    if (!address.trim()) {
      this.includeDeliveryFeeInPayment.set(false);
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
      const address = this.form.controls.shippingDetails.controls.address.value?.trim() || '';
      if (address && address !== this.selectedAddressText) {
        void this.geocodeTypedAddress(address, this.googleMaps);
      }
    }, 200);
  }

  async selectAddressSuggestion(suggestion: any): Promise<void> {
    const prediction = suggestion?.placePrediction;
    if (!prediction || !this.googleMaps) {
      return;
    }

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
        this.shippingAddressProvided.set(formattedAddress.trim().length > 0);
        this.selectedAddressText = formattedAddress.trim();
        this.addressAutocompleteStatus.set(
          barangay ? '' : 'Address found, but Google did not return a barangay. Please enter it manually.'
        );
      });
      this.autocompleteSessionToken = new this.placesLibrary.AutocompleteSessionToken();
    } catch (error) {
      console.error('Google Places address selection failed.', error);
      this.ngZone.run(() => {
        this.addressAutocompleteStatus.set('Address search unavailable. Please try selecting the address again.');
      });
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
              this.shippingAddressProvided.set(true);
              this.addressAutocompleteStatus.set(
                barangay ? '' : 'Address found, but Google did not return a barangay. Please enter it manually.'
              );
            });
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

    if (this.form.invalid || this.items().length === 0) {
      this.form.markAllAsTouched();
      this.message.set('Please complete all required shipping and customer details, and add at least one item.');
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
        this.message.set('The store shipping details are incomplete. Please contact the store before placing your order.');
        this.isSuccess.set(false);
        return;
      }

      const shippingDetails = this.form.controls.shippingDetails.getRawValue();
      const orderTotal = this.orderTotal();
      const order = {
        uid: user.uid,
        createdAt: new Date(),
        customerName: this.form.value.customerName,
        phoneNumber: this.form.value.phoneNumber,
        shippingDetails,
        shipFrom: {
          storeCode: store['storeCode'] || '',
          storeName: store.storeName,
          branchName: store.branchName,
          branchAddress: store.address,
          contactNumber: store.phoneNumber
        },
        items: snapshot.items,
        subtotal: snapshot.subtotal,
        deliveryFee: this.deliveryFee,
        deliveryFeeIncludedInPayment: this.includeDeliveryFeeInPayment(),
        payDeliveryUponArrival: !this.includeDeliveryFeeInPayment(),
        total: orderTotal,
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

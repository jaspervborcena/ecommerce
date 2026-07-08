# Tovrika Ecommerce

Tovrika Ecommerce is the new direction for this project: a multi-merchant commerce platform with a storefront experience, an admin dashboard, and an embeddable checkout that can be integrated into WordPress or other external sites.

## Goal

Build a commerce-first platform that allows merchants to:
- manage products and inventory
- run a storefront experience
- accept online orders
- use checkout and payment methods such as PayPal, credit/debit cards, GCash, and Maya
- embed the checkout into WordPress or other websites

## What this project is becoming

This application will function as:
- a merchant admin dashboard
- a storefront and catalog experience
- a hosted checkout system
- a payment-enabled commerce backend for embedded integration

It will no longer be centered around a POS cashier workflow.

## What we are reusing

The current codebase already provides a strong foundation:
- authentication and user access flow
- company/store structure
- product and inventory concepts
- dashboard shell and admin pages
- payment-related concepts already present in the subscription flow

## What will be removed or replaced

The following POS-oriented pieces are being phased out or simplified:
- cashier POS screens
- receipt printing and thermal printer workflows
- retail-only checkout behavior
- POS-specific UI that is not needed for storefront commerce

## Implementation roadmap

### Phase 1 — Commerce foundation
- keep authentication and company/store structure
- remove or hide POS-first experience from the main flow
- create store/shop routes
- create product listing and product detail pages
- create a basic admin commerce dashboard view

### Phase 2 — Cart and checkout
- add to cart experience
- cart page or drawer
- checkout form
- order creation flow
- order confirmation flow

### Phase 3 — Payments
- PayPal + card payments
- GCash and Maya via a local gateway provider
- payment status tracking
- webhooks and order updates

### Phase 4 — Embeddable integration
- create a lightweight test widget for external sites
- support product embed and checkout embed
- make it usable in WordPress or other sites for testing

### Phase 5 — Merchant onboarding and payment settings
- merchant verification flow
- payment method configuration per store
- secure server-side payment handling
- fraud and compliance safeguards

### Phase 6 — Growth features
- shipping and tax rules
- coupons and discounts
- customer accounts
- analytics and order reporting

## Current status

- [x] Authentication foundation reusable
- [x] Company/store foundation reusable
- [x] Product data model reusable
- [x] Branding updated to Tovrika Ecommerce
- [ ] Storefront pages
- [ ] Cart and checkout
- [ ] Payment integration
- [ ] Embeddable checkout widget
- [ ] Merchant payment settings
- [ ] Merchant onboarding and verification

## Notes for implementation

- reuse existing auth and dashboard structure wherever possible
- keep the admin experience but shift it to commerce operations
- use server-side payment processing for security
- keep the checkout embeddable for third-party sites
- treat the first implementation as a testable MVP, not a full production release

## Related documentation

- See docs/commerce-roadmap.md for the detailed implementation plan and status tracker.

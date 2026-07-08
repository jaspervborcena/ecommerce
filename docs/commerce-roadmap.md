# Commerce Roadmap

This document tracks the transition from the current POS-oriented app into a storefront-first commerce platform for Tovrika Ecommerce.

## Product vision

Tovrika Ecommerce will provide:
- merchant/admin dashboard
- storefront and catalog experience
- hosted checkout flow
- embeddable checkout widget for WordPress and other external sites
- secure payment integrations for PayPal, cards, GCash, and Maya

## Project principles

- reuse the existing authentication and company/store foundation
- keep the dashboard but shift it to commerce operations
- remove or minimize POS-specific UI from the main experience
- make checkout embeddable for third-party websites
- keep the first version as an MVP for testing and integration

## Status legend

- [x] Completed
- [ ] Planned / not started
- [ ] In progress

## Phase 1 — Commerce foundation

### Goals
- remove the POS-first orientation from the main app experience
- keep the reusable auth, store, and product foundation
- introduce storefront routes and a commerce-oriented dashboard view

### Tasks
- [x] Update branding to Tovrika Ecommerce
- [x] Rewrite project README as a commerce roadmap
- [ ] Create storefront routes
- [ ] Create product listing page
- [ ] Create product detail page
- [ ] Create a basic merchant dashboard for commerce operations
- [ ] Remove or hide POS-first entry points from the main experience

## Phase 2 — Cart and checkout

### Goals
- allow customers to add products to cart
- build a simple checkout flow
- create order records and confirmation screens

### Tasks
- [ ] Build add-to-cart experience
- [ ] Build cart page or drawer
- [ ] Build checkout form
- [ ] Create order creation flow
- [ ] Create order success / failure screens
- [ ] Link orders to merchant/company context

## Phase 3 — Payments

### Goals
- support PayPal and card payments
- support GCash and Maya via a provider
- track payment status and order status updates

### Tasks
- [ ] Add PayPal / card payment provider integration
- [ ] Add GCash and Maya provider integration
- [ ] Create payment status handling
- [ ] Add webhook or callback handling for payment success/failure
- [ ] Connect payments to order lifecycle

## Phase 4 — Embeddable integration

### Goals
- provide a test widget that can be embedded in other websites
- support product embed and checkout embed
- make the flow testable in WordPress or similar platforms

### Tasks
- [ ] Create a lightweight embeddable product button widget
- [ ] Create an embeddable checkout widget
- [ ] Add configuration for merchant ID, product ID, currency, and theme
- [ ] Test integration in a simple external page
- [ ] Document WordPress embed approach

## Phase 5 — Merchant onboarding and payment settings

### Goals
- let merchants configure payment methods per store
- verify merchant identity and store legitimacy
- enforce secure server-side payment handling

### Tasks
- [ ] Add merchant payment settings page
- [ ] Add per-store payment method configuration
- [ ] Add merchant verification / onboarding flow
- [ ] Add secure payment credential handling approach
- [ ] Add fraud and compliance safeguards

## Phase 6 — Growth features

### Goals
- move from MVP toward a scalable commerce platform

### Tasks
- [ ] Shipping rules
- [ ] Tax rules
- [ ] Coupons and discounts
- [ ] Customer accounts
- [ ] Analytics and reporting
- [ ] Refunds and dispute handling

## Notes

- This roadmap is intentionally MVP-focused at first.
- The first milestone is to prove a working storefront, checkout, and payment flow that can be embedded elsewhere.
- Payment providers should be integrated behind a provider abstraction so the app can support multiple gateways cleanly.

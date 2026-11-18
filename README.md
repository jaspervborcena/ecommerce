# Tovrika Ecommerce

Tovrika is a multi-branch commerce app with account setup, company onboarding, public branch and product browsing, cart, and checkout flows. Firebase project configuration and the storefront company slug are supplied by the Angular environment files.

The current UI keeps authentication and account recovery, home, onboarding, company setup, branch browsing, and storefront checkout. Other management and operations screens are intentionally removed while the app is being simplified.

## Goal

Build a commerce-first platform that allows Bentamu and its branches to:
- manage products and inventory
- operate multiple branches under one organization
- run a central storefront and branch-specific storefront experiences
- accept online orders
- assign orders to the appropriate branch for fulfillment
- support influencer and reseller accounts with tracked sales
- calculate and manage commissions for completed orders
- support a dropshipping-style workflow where approved partners sell without stocking products
- use checkout and payment methods such as PayPal, credit/debit cards, GCash, and Maya
- embed the checkout into WordPress or other websites

## Product direction

The product is focused on company and branch onboarding followed by public storefront shopping. Visitors can browse before signing in; an account is required to complete checkout, and an authenticated shopper has customer access.

## What we are reusing

The current codebase already provides a strong foundation:
- authentication and user access flow
- company/store structure
- public storefront, cart, and checkout
- payment-related concepts already present in the subscription flow

## What will be removed or replaced

The following POS-oriented pieces are being phased out or simplified:
- cashier POS screens
- receipt printing and thermal printer workflows
- retail-only checkout behavior
- POS-specific UI that is not needed for storefront commerce

## Business model

### Customer access roles
- guests are visitors who have not created an account or logged in
- guests can browse products and begin shopping without authentication
- customers are users who have created an account or successfully logged in
- customers can manage their profile, view their orders, and access customer-only features
- influencer accounts are approved partner accounts with additional sales permissions; they also remain customers when shopping for themselves

### Role-based accounts and login
The platform will provide a separate role-based login for users who need business or partner access. These accounts are authenticated users with permissions beyond the standard customer experience:
- **Influencer:** promotes products through referral links or codes and earns commissions on eligible sales
- **Owner:** manages the Shao Tang business and its branches; represented internally by the `creator` role
- **Admin:** manages platform-wide administration and support operations
- **Store manager:** manages an assigned branch, including products, inventory, staff, and fulfillment
- **Coordinator:** coordinates branch operations, order assignment, fulfillment, and partner activity

Role-based users can also shop as customers. Their operational permissions must remain separate from customer shopping permissions, and access must be controlled by role, branch, and organization scope.

### Branch operations
- maintain a central Shao Tang organization with multiple branches
- manage branch access, staff permissions, inventory, and fulfillment
- support branch-specific availability, pricing, and order assignment

### Influencer and reseller sales
- onboard and approve influencers or resellers
- provide trackable referral links, codes, or product pages
- attribute eligible orders to the correct partner
- calculate commissions after payment and order completion
- support commission review, payout status, and dispute handling
- prevent commissions on cancelled, refunded, or fraudulent orders

### Dropshipping-style fulfillment
- partners promote products without holding inventory
- Shao Tang or the assigned branch fulfills the order
- shipping and customer communication remain visible to the responsible operations team
- commission eligibility is tied to fulfillment and refund status

## Implementation roadmap

### Phase 1 - Commerce foundation
- keep authentication and company/store structure
- define guest and customer access states
- create a separate role-based login for influencers, owners, admins, store managers, and coordinators
- define role permissions and branch or organization scope
- define Shao Tang organization and branch roles
- remove or hide POS-first experience from the main flow
- keep store/shop and product listing/detail routes
- create a basic admin commerce dashboard view

### Phase 2 - Cart and checkout
- add to cart experience
- cart page or drawer
- checkout form
- order creation flow
- order confirmation flow
- assign orders to a branch for fulfillment

### Phase 3 - Payments
- PayPal + card payments
- GCash and Maya via a local gateway provider
- payment status tracking
- webhooks and order updates

### Phase 4 - Influencer and reseller channel
- create influencer and reseller profiles
- generate referral links and discount or attribution codes
- track clicks, referred carts, and completed orders
- calculate commission amounts and eligibility
- add commission statements and payout status

### Phase 5 - Embeddable integration
- create a lightweight test widget for external sites
- support product embed and checkout embed
- make it usable in WordPress or other sites for testing

### Phase 6 - Branch onboarding and payment settings
- branch onboarding and approval flow
- branch verification and access controls
- payment method configuration per store
- secure server-side payment handling
- fraud and compliance safeguards

### Phase 7 - Growth features
- shipping and tax rules
- coupons and discounts
- customer accounts
- analytics and order reporting
- influencer performance reporting
- automated commission payouts

## Current status

- [x] Authentication foundation reusable
- [x] Guest and customer authentication states defined
- [ ] Separate role-based login
- [ ] Influencer, owner, admin, store manager, and coordinator permissions
- [x] Company/store foundation reusable
- [x] Product data model reusable
- [x] Branding updated to Tovrika
- [x] Firebase web app configured for `jasperpos-1dfd5`
- [x] Storefront pages
- [x] Cart and checkout
- [ ] Payment integration
- [ ] Multi-branch operations
- [ ] Influencer and reseller tracking
- [ ] Commission calculation and payouts
- [ ] Embeddable checkout widget
- [ ] Branch payment settings
- [ ] Branch onboarding and verification

## Notes for implementation

- keep only the current onboarding, auth, branch browsing, and storefront routes active
- use `companySlug` in the Angular environment to resolve the public company projection
- model branches as first-class operational units under Shao Tang
- keep inventory, fulfillment, and permissions scoped to the correct branch
- calculate commissions on the server after payment and order status updates
- record referral attribution and commission changes for auditability
- use server-side payment processing for security
- keep the checkout embeddable for third-party sites
- treat the first implementation as a testable MVP, not a full production release

## Related documentation

- See docs/commerce-roadmap.md for the detailed implementation plan and status tracker.
- See POSTMAN-SAMPLE-DATA-README.md for the sample Firestore data and Postman usage notes.

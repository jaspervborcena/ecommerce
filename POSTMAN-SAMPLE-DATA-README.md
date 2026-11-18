# Postman Sample Data Guide

[`postman-sample-data.json`](./postman-sample-data.json) contains three illustrative document bodies for each Firestore collection path represented in this project. Use it as a reference when testing an API with Postman; the grouped fixture itself is not a request payload.

## Features represented

The sample records cover these application areas:

- **Catalog and stock:** products, inventory batches, and inventory entries with pricing, VAT, discounts, expiry, and sync fields.
- **Sales and reconciliation:** orders, order details, item-level selling tracking, and inventory reconciliation records.
- **Organization and access:** companies, stores, branches, users, roles, role definitions, and user permissions.
- **Customer and communications:** customer profiles and notifications.
- **Devices and billing:** POS devices, subscriptions, company billing history, invoice sequences, and counters.
- **Supporting configuration:** categories, predefined types, system configuration, and invoices.

The fixture includes 25 collection paths, with three examples per path. It omits nested transaction examples because the main company, store, and branch collections already cover the organizational data in this fixture. Field shapes are based on the app's interfaces where available. For collections that only appear in the Firestore rules and do not have a complete app interface, the fields are illustrative rather than a guaranteed API contract.

## Send one sample in Postman

1. Open `postman-sample-data.json` and find the collection you want to test.
2. Copy one object from that collection's array. Do not copy the outer fixture or the entire array unless your endpoint explicitly accepts a batch.
3. In Postman, choose **Body → raw → JSON**, paste the object, and set `Content-Type: application/json`.
4. Send it to the matching endpoint in your API. The project fixture does not define a universal REST endpoint; use the route and HTTP method exposed by the API you are testing.
5. Authenticate as the user represented by the payload, or replace sample ownership IDs with the authenticated user's real IDs.

For example, the first `products` object is an application-style JSON document. The objects use placeholder identifiers such as `sample-user-001`, `sample-company-001`, and `sample-store-001`; these IDs do not create corresponding Firebase Auth users or related documents.

## Firestore notes

- The examples are **raw document JSON**, not Firestore REST API JSON. Firestore's REST API expects typed values under a `fields` object (for example, strings use `stringValue`, numbers use `integerValue` or `doubleValue`, and timestamps use `timestampValue`). Convert the object to that format before sending it directly to the Firestore REST endpoint.
- Dates are represented as ISO-8601 strings for readability. An application API may parse them, but Firestore REST requires timestamp values in its typed format.
- Firestore security rules still apply. Many writes require `uid` to equal the authenticated Firebase user's UID; substitute a real UID and provide a valid authentication token.
- Rules restrict writes to some collections. For example, `reconciliationLog`, `predefinedTypes`, and `systemConfig` are system-managed or server-written in the current rules. A normal Postman request with a user token cannot bypass those restrictions; use an authorized backend/Admin SDK flow for server-managed data.
- Several sample collections reference other sample IDs. Create related records as needed, and ensure the referenced company, store, product, order, and user IDs match your test data.
- These records are for development and testing only. Do not use the placeholder business, customer, invoice, or compliance details for real transactions.

## Backfill connected sample data

The fixture has three records for each of its 25 collections. The Admin SDK backfill supplements it with sample records for the other collections referenced by the app and Firestore rules, plus nested company stores, branch inventory, and transaction records. It uses stable `sample-*` document IDs and links each sample company to a store, branch, products, inventory, and related sales records. ISO date fields are written as Firestore timestamps.

Run the backfill tests without connecting to Firebase:

```powershell
cd functions
npm run test:backfill
```

Preview a backfill for a separate test project:

```powershell
npm run backfill:sample-data -- --project-id <test-project-id>
```

The command is a dry run unless `--apply` is provided. To write, use an isolated test project ID:

```powershell
npm run backfill:sample-data -- --project-id <test-project-id> --apply
```

Writes use the Admin SDK, so Firestore security rules do not restrict system-managed sample collections. The script refuses to apply writes to projects listed in `.firebaserc` unless `FIRESTORE_EMULATOR_HOST` is set or `--allow-configured-project` is explicitly passed. Re-running it updates the same reserved sample document IDs. It does not create Firebase Authentication users, and the placeholder UIDs cannot sign in.

## Backfill the customer journey

[`firestore-customer-journey.json`](./firestore-customer-journey.json) is a focused, linked scenario for an owner-created business and a separate shopper checkout:

The JSON records the final state of these journey steps: the owner registers, creates a company, branches, and products; a visitor browses without producing a document; then a separate shopper registers and checks out as a customer.

The fixture mirrors the storefront branch selector: branches are top-level `stores` documents, and their document IDs are used as `storeId`. Create the owner Firebase Authentication account in the app first. The shopper profile is sample-only and cannot sign in; pass a real shopper UID/email instead if you need a sign-in-capable customer. No passwords are stored.

The fixture writes `storefront_companies`, `storefront_stores`, and `storefront_products` projections containing only public lookup and browsing fields; private company, store, and product documents are not readable anonymously. For this sample company, open `/branches?companyId=sample-company-001`; selecting a branch opens its product storefront. Deploy the updated Firestore rules and app before anonymous browsing will work in the live site.

From the repository root, preview the journey fixture without writing:

```powershell
Set-Location functions
npm.cmd run backfill:customer-journey -- --project-id <test-project-id> --owner-uid <owner-auth-uid> --owner-email <owner-email> --shopper-uid sample-shopper-journey-001 --shopper-email shopper@journey.example.test
```

Add `--apply` only when intentionally writing to an isolated test project. The existing configured-project safety check still applies:

```powershell
npm.cmd run backfill:customer-journey -- --project-id <test-project-id> --owner-uid <owner-auth-uid> --owner-email <owner-email> --shopper-uid sample-shopper-journey-001 --shopper-email shopper@journey.example.test --apply
```

The checkout route requires an account. Registration and sign-in preserve the checkout return path, and new accounts receive the `customer` role before an order is submitted. The fixture's order is linked to the shopper UID and has `roleId: "customer"` to represent that post-registration state.

## Related project documentation

- [`README.md`](./README.md) describes the project's direction and implementation roadmap.
- [`firestore.rules`](./firestore.rules) defines the current Firestore access rules.

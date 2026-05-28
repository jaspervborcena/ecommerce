# Version Notes

## 2026-05-28
- **Removed currency symbol (₱)** from all receipt amounts for regional flexibility and cleaner display
- **Updated printing services** with improved receipt formatting and template structure
- **Added cash or charge** payment type indicator refinements
- **Enhanced subscription management** - Updated subscription data flow from stores with improved validation
- **Improved product validation** - Added validation for duplicate products and subscription handling
- **Updated receipt template** with better formatting and layout improvements
- **Added font structure** - Improved typography and text rendering in receipts and UI
- **Enhanced subscription UI** - Added submit button and improved form handling in subscription features

## 2026-05-19
- Added a new `/versions` page to display release notes and top changes.
- Created `VersionsComponent` to load markdown from `assets/versions.md`.
- Added explicit version display using `environment.version`.

## 2026-05-18
- Added `version` to `orderDetails` documents created in both online and offline invoice flows.
- Extended ledger support for `unpaid` and `recovered` event types.
- Updated `LedgerService.getAdjustmentTotals()` to aggregate unpaid/recovered data.
- Added inventory weekly filters and dashboard weekly date support.

## Notes
- Update this file whenever new app changes are released.
- The newest entries should remain at the top.

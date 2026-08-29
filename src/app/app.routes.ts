import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'store/:storeId',
    loadComponent: () => import('./pages/storefront/storefront-list.component').then(m => m.StorefrontListComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/storefront/storefront-detail.component').then(m => m.StorefrontDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/storefront/storefront-cart.component').then(m => m.StorefrontCartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/storefront/storefront-checkout.component').then(m => m.StorefrontCheckoutComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'branches',
    loadComponent: () => import('./pages/dashboard/branches/branches.component').then(m => m.BranchesComponent)
  },
  {
    path: 'product-listing',
    loadComponent: () => import('./pages/product-listing/product-listing.component').then(m => m.ProductListingComponent)
  },
  {
    path: 'join-store',
    loadComponent: () => import('./pages/join-store/join-store.component').then(m => m.JoinStoreComponent)
  },
  {
    path: 'policy-agreement',
    loadComponent: () => import('./pages/auth/policy-agreement/policy-agreement.component').then(m => m.PolicyAgreementComponent)
  },
  {
    path: 'company-selection',
    loadComponent: () => import('./pages/company-selection/company-selection.component').then(m => m.CompanySelectionComponent)
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help/help.component').then(m => m.HelpComponent)
  },
  {
    path: 'versions',
    loadComponent: () => import('./pages/versions/versions.component').then(m => m.VersionsComponent)
  },
  {
    path: 'account-settings',
    loadComponent: () => import('./pages/account-settings/account-settings.component').then(m => m.AccountSettingsComponent)
  },
  {
    path: 'print-setup',
    loadComponent: () => import('./pages/print-setup/print-setup.component').then(m => m.PrintSetupComponent)
  },
  {
    path: 'import',
    loadComponent: () => import('./pages/import/import.component').then(m => m.ImportComponent)
  },
  {
    path: 'customer-view/:sessionId',
    loadComponent: () => import('./pages/customer-view/customer-view.component').then(m => m.CustomerViewComponent)
  },
  {
    path: 'features/inventory',
    loadComponent: () => import('./pages/features/inventory/feature-inventory.component').then(m => m.FeatureInventoryComponent)
  },
  {
    path: 'features/reports',
    loadComponent: () => import('./pages/features/reports/feature-reports.component').then(m => m.FeatureReportsComponent)
  },
  {
    path: 'features/multistore',
    loadComponent: () => import('./pages/features/multistore/feature-multistore.component').then(m => m.FeatureMultistoreComponent)
  },
  {
    path: 'features/offline',
    loadComponent: () => import('./pages/features/offline/feature-offline.component').then(m => m.FeatureOfflineComponent)
  },
  {
    path: 'features/cloudsync',
    loadComponent: () => import('./pages/features/cloudsync/feature-cloudsync.component').then(m => m.FeatureCloudSyncComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'company-profile', loadComponent: () => import('./pages/dashboard/company-profile/company-profile.component').then(m => m.CompanyProfileComponent) },
      { path: 'overview', loadComponent: () => import('./pages/dashboard/overview/overview.component').then(m => m.OverviewComponent) },
      { path: 'storefront-settings', loadComponent: () => import('./pages/dashboard/storefront/storefront-settings.component').then(m => m.StorefrontSettingsComponent) },
      { path: 'stores', loadComponent: () => import('./pages/dashboard/stores-management/stores-management.component').then(m => m.StoresManagementComponent) },
      { path: 'branches', loadComponent: () => import('./pages/dashboard/branches/branches.component').then(m => m.BranchesComponent) },
      { path: 'access', loadComponent: () => import('./pages/dashboard/access/access.component').then(m => m.AccessComponent) },
      { path: 'user-roles', loadComponent: () => import('./pages/dashboard/user-roles/user-roles.component').then(m => m.UserRolesComponent) },
      { path: 'subscriptions', loadComponent: () => import('./pages/dashboard/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent) },
      { path: 'admin', loadComponent: () => import('./pages/dashboard/admin/admin.component').then(m => m.AdminComponent) },
      { path: 'invoice-setup', loadComponent: () => import('./pages/dashboard/invoice-setup/invoice-setup.component').then(m => m.InvoiceSetupComponent) },
      { path: 'products', loadComponent: () => import('./pages/dashboard/products/product-management.component').then(m => m.ProductManagementComponent) },
      { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'sales/summary', loadComponent: () => import('./pages/dashboard/sales/sales-summary/sales-summary.component').then(m => m.SalesSummaryComponent) },
      { path: 'offline-order-reconciliation', loadComponent: () => import('./pages/dashboard/offline-order-reconciliation/offline-order-reconciliation.component').then(m => m.OfflineOrderReconciliationComponent) }
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

import { Routes } from '@angular/router';
import { checkoutAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'branches',
    loadComponent: () => import('./pages/dashboard/branches/branches.component').then(m => m.BranchesComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'create-company',
    loadComponent: () => import('./pages/dashboard/company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
  },
  {
    path: 'join-store',
    loadComponent: () => import('./pages/join-store/join-store.component').then(m => m.JoinStoreComponent)
  },
  {
    path: 'company-selection',
    loadComponent: () => import('./pages/company-selection/company-selection.component').then(m => m.CompanySelectionComponent)
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
    canActivate: [checkoutAuthGuard],
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
    path: 'policy-agreement',
    loadComponent: () => import('./pages/auth/policy-agreement/policy-agreement.component').then(m => m.PolicyAgreementComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

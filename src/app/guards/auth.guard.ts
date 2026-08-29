import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    console.warn(`🛡️ AuthGuard: Unauthenticated access attempt to ${state.url}`);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const currentUser = authService.currentUser();
  const currentPermission = authService.getCurrentPermission();

  const isOnboarding = !currentPermission?.companyId || currentPermission.roleId === 'visitor' || currentPermission.roleId === 'customer';
  const isCompanyProfileRoute = state.url.includes('/dashboard/company-profile');
  const isBranchesRoute = state.url.includes('/dashboard/branches');
  const isOnboardingRoute = state.url === '/onboarding';

  // ✅ Allow onboarding users (visitor/customer without companyId) to access setup routes
  if (isOnboarding) {
    if (isOnboardingRoute || isCompanyProfileRoute || isBranchesRoute) {
      console.log('🛡️ AuthGuard: Onboarding user accessing allowed setup route - allowing');
      return true;
    }
    console.warn('🛡️ AuthGuard: Onboarding user blocked from protected route, redirecting to onboarding');
    router.navigate(['/onboarding']);
    return false;
  }

  // ✅ Allow access to company-profile and branches if user has no companyId (onboarding)
  if (!currentPermission?.companyId && (isCompanyProfileRoute || isBranchesRoute)) {
    console.log('🛡️ AuthGuard: No companyId but accessing allowed onboarding route - allowing');
    return true;
  }

  // 🚫 Block access if no companyId and not on company-profile/branches
  if (!currentPermission?.companyId) {
    console.warn(`🛡️ AuthGuard: Missing companyId for ${state.url}, redirecting to company-profile`);
    router.navigate(['/dashboard/company-profile']);
    return false;
  }

  // ✅ Allow access to company-selection if user has multiple companies and none selected
  if (authService.hasMultipleCompanies() && !currentPermission?.companyId) {
    if (state.url !== '/company-selection') {
      router.navigate(['/company-selection']);
      return false;
    }
    return true;
  }

  // ✅ Final check: ensure user account is active
  if (currentUser?.status !== 'active') {
    console.warn(`🛡️ AuthGuard: Inactive user account attempted access to ${state.url}`);
    router.navigate(['/login']);
    return false;
  }

  // Role-based checks are handled by roleGuard now
  return true;
};

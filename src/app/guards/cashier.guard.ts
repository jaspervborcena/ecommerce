import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const cashierGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ CashierGuard: Checking access for URL:', state.url);
  
  const user = authService.currentUser();
  if (!user) {
    console.log('🛡️ CashierGuard: No user, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  const currentPermission = authService.getCurrentPermission();
  
  // Allow cashiers to continue to the dashboard flow
  if (currentPermission?.roleId === 'cashier') {
    console.log('🛡️ CashierGuard: Cashier detected, allowing access to dashboard');
    return true;
  }

  // For non-cashiers, allow access
  console.log('🛡️ CashierGuard: Non-cashier user, allowing access');
  return true;
};
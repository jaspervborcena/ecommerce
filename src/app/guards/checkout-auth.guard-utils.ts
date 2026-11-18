import { Router, UrlTree } from '@angular/router';

export function getCheckoutAccessResult(
  router: Router,
  isAuthenticated: boolean,
  returnUrl: string
): true | UrlTree {
  if (isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/register'], {
    queryParams: { returnUrl }
  });
}

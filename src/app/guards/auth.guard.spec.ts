import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { getCheckoutAccessResult } from './checkout-auth.guard-utils';

describe('checkoutAuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
  });

  it('redirects guests to registration and preserves the checkout URL', () => {
    const result = getCheckoutAccessResult(TestBed.inject(Router), false, '/checkout');

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree))
      .toBe('/register?returnUrl=%2Fcheckout');
  });

  it('allows authenticated customers to continue checkout', () => {
    const result = getCheckoutAccessResult(TestBed.inject(Router), true, '/checkout');

    expect(result).toBeTrue();
  });
});

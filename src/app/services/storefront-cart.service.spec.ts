import { TestBed } from '@angular/core/testing';
import { StorefrontCartService } from './storefront-cart.service';

describe('StorefrontCartService', () => {
  let service: StorefrontCartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorefrontCartService);
  });

  it('adds a product and updates totals', () => {
    service.addItem({
      id: 'p1',
      productName: 'Coffee',
      sellingPrice: 120,
      currency: 'PHP',
      storeId: 'store-1'
    }, 2);

    const cart = service.getCartSnapshot();
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.total).toBe(240);
  });

  it('removes an item and clears cart when empty', () => {
    service.addItem({ id: 'p1', productName: 'Coffee', sellingPrice: 120, currency: 'PHP', storeId: 'store-1' }, 1);
    service.removeItem('p1');

    const cart = service.getCartSnapshot();
    expect(cart.items.length).toBe(0);
    expect(cart.total).toBe(0);
  });

  it('preserves the active store and currency after clearing the cart', () => {
    service.addItem({
      id: 'p1',
      productName: 'Coffee',
      sellingPrice: 120,
      currency: 'USD',
      storeId: 'store-42'
    }, 1);

    service.clear();

    const cart = service.getCartSnapshot();
    expect(cart.items).toEqual([]);
    expect(cart.storeId).toBe('store-42');
    expect(cart.currency).toBe('USD');
  });
});

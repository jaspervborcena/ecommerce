import { Product, ProductStatus } from '../interfaces/product.interface';
import { Store } from '../interfaces/store.interface';
import {
  toPublicStorefrontCompany,
  toPublicStorefrontProduct,
  toPublicStorefrontStore
} from './storefront-publication.service';

describe('storefront public projections', () => {
  it('publishes a safe slug-to-company lookup without owner details', () => {
    expect(toPublicStorefrontCompany('company-1', {
      name: 'Harbor Coffee',
      slug: 'Harbor-Coffee',
      ownerUid: 'owner-uid',
      email: 'private@example.test'
    })).toEqual({
      companyId: 'company-1',
      name: 'Harbor Coffee',
      slug: 'harbor-coffee',
      status: 'active'
    });
  });

  it('publishes only active, browse-safe store fields', () => {
    const store: Partial<Store> = {
      uid: 'owner-uid',
      companyId: 'company-1',
      storeName: 'Harbor Coffee',
      branchName: 'Main Branch',
      address: '10 Test Street',
      phoneNumber: 'private-phone',
      email: 'private@example.test',
      tinNumber: 'private-tax-id',
      status: 'active'
    };

    expect(toPublicStorefrontStore(store)).toEqual({
      companyId: 'company-1',
      storeName: 'Harbor Coffee',
      branchName: 'Main Branch',
      address: '10 Test Street',
      status: 'active'
    });
  });

  it('does not publish inactive stores or products', () => {
    expect(toPublicStorefrontStore({ status: 'inactive' })).toBeNull();
    expect(toPublicStorefrontProduct({ status: ProductStatus.Inactive })).toBeNull();
  });

  it('omits internal product cost, stock, owner, and tax fields', () => {
    const product: Partial<Product> = {
      uid: 'owner-uid',
      storeId: 'store-1',
      productName: 'House Blend Coffee',
      sellingPrice: 320,
      costPrice: 220,
      totalStock: 12,
      isVatApplicable: true,
      vatRate: 12,
      status: ProductStatus.Active
    };
    const projection = toPublicStorefrontProduct(product);

    expect(projection).toEqual({
      storeId: 'store-1',
      productName: 'House Blend Coffee',
      sellingPrice: 320,
      status: 'active',
      currency: 'PHP'
    });
  });
});

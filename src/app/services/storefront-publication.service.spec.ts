import { Product, ProductStatus } from '../interfaces/product.interface';
import { Branch } from '../interfaces/branch.interface';
import { Store } from '../interfaces/store.interface';
import {
  toPublicStorefrontBranch,
  toPublicStorefrontCompany,
  toPublicStorefrontProduct,
  toPublicStorefrontStore
} from './storefront-publication.service';

describe('storefront public projections', () => {
  it('publishes the branch-to-store link and safe public branch fields', () => {
    const branch: Partial<Branch> = {
      uid: 'owner-uid',
      companyId: 'company-1',
      storeId: 'store-1',
      name: 'Main Branch',
      address: {
        street: '10 Test Street',
        city: 'Manila',
        state: 'Metro Manila',
        zipCode: '1000',
        country: 'Philippines'
      },
      isActive: true,
      assignedUsers: ['private-user'],
      settings: {
        operatingHours: [{ dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' }],
        contactInfo: { phone: 'private-phone', email: 'private@example.test' },
        posSettings: {
          enableCustomerDisplay: false,
          requireSignature: false,
          allowDiscounts: true,
          maxDiscountPercent: 20
        }
      }
    };

    expect(toPublicStorefrontBranch(branch)).toEqual({
      companyId: 'company-1',
      storeId: 'store-1',
      name: 'Main Branch',
      address: '10 Test Street, Manila, Metro Manila, 1000, Philippines',
      status: 'active',
      storeHours: '09:00 - 18:00'
    });
    expect(toPublicStorefrontBranch({ ...branch, isActive: false })).toBeNull();
  });

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

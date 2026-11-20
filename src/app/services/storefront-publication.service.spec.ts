import { toPublicStorefrontCompany } from './storefront-publication.service';

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
});

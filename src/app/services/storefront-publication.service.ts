import { Injectable, inject } from '@angular/core';
import { Firestore, deleteDoc, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Company } from '../interfaces/company.interface';

export interface PublicStorefrontCompany {
  companyId: string;
  slug: string;
  name: string;
  status: 'active';
}

export function toPublicStorefrontCompany(
  companyId: string,
  company: Partial<Company>
): PublicStorefrontCompany | null {
  const slug = company.slug?.trim().toLowerCase();
  const name = company.name?.trim();
  if (!companyId || !slug || slug.includes('/') || !name) {
    return null;
  }

  return {
    companyId,
    slug,
    name,
    status: 'active'
  };
}

@Injectable({ providedIn: 'root' })
export class StorefrontPublicationService {
  private readonly firestore = inject(Firestore);

  async syncCompany(companyId: string, company: Partial<Company>): Promise<void> {
    const projection = toPublicStorefrontCompany(companyId, company);
    if (!projection) {
      throw new Error(`Company ${companyId} cannot be published without a valid slug and name.`);
    }
    await setDoc(doc(this.firestore, 'storefront_companies', projection.slug), projection);
  }

  async getCompanyBySlug(slug: string): Promise<PublicStorefrontCompany | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug || normalizedSlug.includes('/')) {
      return null;
    }

    const snapshot = await getDoc(doc(this.firestore, 'storefront_companies', normalizedSlug));
    if (!snapshot.exists()) {
      return null;
    }

    const company = snapshot.data() as Partial<PublicStorefrontCompany>;
    if (
      company.slug !== normalizedSlug ||
      typeof company.companyId !== 'string' ||
      typeof company.name !== 'string' ||
      company.status !== 'active'
    ) {
      throw new Error(`Invalid public storefront company projection for slug "${normalizedSlug}".`);
    }
    return {
      companyId: company.companyId,
      slug: company.slug,
      name: company.name,
      status: 'active'
    };
  }

  async removeCompany(slug: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'storefront_companies', slug.trim().toLowerCase()));
  }

}

import { Injectable, inject } from '@angular/core';
import { Firestore, deleteDoc, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Product } from '../interfaces/product.interface';
import { Company } from '../interfaces/company.interface';
import { Store } from '../interfaces/store.interface';

export interface PublicStorefrontCompany {
  companyId: string;
  slug: string;
  name: string;
  status: 'active';
}

export interface PublicStorefrontStore {
  companyId: string;
  storeName: string;
  branchName: string;
  address: string;
  status: 'active';
  logoUrl?: string;
}

export interface PublicStorefrontProduct {
  storeId: string;
  productName: string;
  sellingPrice: number;
  status: 'active';
  description?: string;
  skuId?: string;
  category?: string;
  unitType?: string;
  imageUrl?: string;
  currency: string;
}

export function toPublicStorefrontStore(store: Partial<Store>): PublicStorefrontStore | null {
  if (
    store.status !== 'active' ||
    !store.companyId ||
    !store.storeName ||
    !store.branchName
  ) {
    return null;
  }

  return {
    companyId: store.companyId,
    storeName: store.storeName,
    branchName: store.branchName,
    address: store.address || '',
    status: 'active',
    ...(store.logoUrl ? { logoUrl: store.logoUrl } : {})
  };
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

export function toPublicStorefrontProduct(product: Partial<Product>): PublicStorefrontProduct | null {
  if (
    product.status !== 'active' ||
    !product.storeId ||
    !product.productName ||
    typeof product.sellingPrice !== 'number' ||
    !Number.isFinite(product.sellingPrice)
  ) {
    return null;
  }

  return {
    storeId: product.storeId,
    productName: product.productName,
    sellingPrice: Number(product.sellingPrice),
    status: 'active',
    currency: 'PHP',
    ...(product.description ? { description: product.description } : {}),
    ...(product.skuId ? { skuId: product.skuId } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.unitType ? { unitType: product.unitType } : {}),
    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {})
  };
}

@Injectable({ providedIn: 'root' })
export class StorefrontPublicationService {
  private readonly firestore = inject(Firestore);

  async syncStore(storeId: string, store: Partial<Store>): Promise<void> {
    const projection = toPublicStorefrontStore(store);
    const reference = doc(this.firestore, 'storefront_stores', storeId);
    if (!projection) {
      await deleteDoc(reference);
      return;
    }
    await setDoc(reference, projection);
  }

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

  async removeStore(storeId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'storefront_stores', storeId));
  }

  async syncProduct(productId: string, product: Partial<Product>): Promise<void> {
    const projection = toPublicStorefrontProduct(product);
    const reference = doc(this.firestore, 'storefront_products', productId);
    if (!projection) {
      await deleteDoc(reference);
      return;
    }
    await setDoc(reference, projection);
  }

  async removeProduct(productId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'storefront_products', productId));
  }
}

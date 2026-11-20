export interface StorefrontProduct {
  id: string;
  storeId: string;
  productName: string;
  sellingPrice: number;
  currency?: string;
  imageUrl?: string;
  shortDescription?: string;
  description?: string;
  skuId?: string;
  category?: string;
}

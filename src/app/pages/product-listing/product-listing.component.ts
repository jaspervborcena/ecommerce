import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

interface Product {
  id: string;
  barcodeId?: string;
  category?: string;
  companyId?: string;
  isFavorite?: boolean;
  originalPrice?: number;
  productCode?: string;
  productName: string;
  sellingPrice: number;
  skuId?: string;
  status: string;
  storeId: string;
  totalStock?: number;
  unitType?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./product-listing.component.css'],
  template: `
    <div class="product-listing-container">
      <div class="listing-header">
        <button
          type="button"
          (click)="goBackToBranches()"
          class="back-button"
        >
          <span aria-hidden="true">←</span> Back to Branches
        </button>
      </div>

      <div class="listing-hero">
        <p class="section-kicker">Store Products</p>
        <h1 class="listing-title">Available Products</h1>
        <p class="listing-subtitle">Browse and select products from this store.</p>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading products...</p>
        </div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <p class="empty-state-title">No products available</p>
          <p class="empty-state-text">This store has no active products right now.</p>
        </div>
      } @else {
        <div class="product-grid">
          @for (product of products(); track product.id) {
            <article class="product-card-item">
              <div class="product-image-wrap">
                <img 
                  [src]="product.imageUrl || 'assets/noimage.png'" 
                  [alt]="product.productName"
                  class="product-image"
                />
              </div>
              <div class="product-content">
                <p class="product-category">{{ product.category || 'N/A' }}</p>
                <h2 class="product-name">{{ product.productName }}</h2>
                
                <div class="product-details">
                  <div class="detail-row">
                    <span class="detail-label">SKU:</span>
                    <span class="detail-value">{{ product.skuId || '-' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Stock:</span>
                    <span class="detail-value">{{ product.totalStock || 0 }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Unit:</span>
                    <span class="detail-value">{{ product.unitType || 'N/A' }}</span>
                  </div>
                </div>

                <div class="product-pricing">
                  @if (product.originalPrice && product.originalPrice !== product.sellingPrice) {
                    <span class="original-price">₱{{ product.originalPrice }}</span>
                  }
                  <span class="selling-price">₱{{ product.sellingPrice }}</span>
                </div>

                <button class="add-to-cart-btn" (click)="addToCart(product)">
                  Add to Cart
                </button>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `
})
export class ProductListingComponent implements OnInit {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  private storeId: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.storeId = params['storeId'] || '';
      console.log('🛍️ ProductListingComponent: Loading products for storeId:', this.storeId);
      if (this.storeId) {
        void this.loadProducts();
      } else {
        console.warn('🛍️ ProductListingComponent: No storeId provided');
        this.isLoading.set(false);
      }
    });
  }

  private async loadProducts() {
    this.isLoading.set(true);

    try {
      const companyId = environment.defaultCompanyId;
      console.log('🛍️ ProductListingComponent: Querying products for:', {
        companyId,
        storeId: this.storeId
      });

      const productsRef = collection(this.firestore, 'products');
      const q = query(
        productsRef,
        where('storeId', '==', this.storeId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const loadedProducts: Product[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as any;
        loadedProducts.push({
          id: doc.id,
          barcodeId: data.barcodeId,
          category: data.category,
          companyId: data.companyId,
          isFavorite: data.isFavorite || false,
          originalPrice: data.originalPrice,
          productCode: data.productCode,
          productName: data.productName,
          sellingPrice: data.sellingPrice,
          skuId: data.skuId,
          status: data.status,
          storeId: data.storeId,
          totalStock: data.totalStock,
          unitType: data.unitType,
          imageUrl: data.imageUrl
        });
      });

      console.log('🛍️ ProductListingComponent: Loaded products:', {
        count: loadedProducts.length,
        products: loadedProducts
      });

      this.products.set(loadedProducts);
    } catch (error) {
      console.error('🛍️ ProductListingComponent: Error loading products:', error);
      this.products.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected goBackToBranches() {
    this.router.navigate(['/branches']);
  }

  protected addToCart(product: Product) {
    console.log('🛒 Adding to cart:', product);
    // TODO: Implement cart functionality
  }
}

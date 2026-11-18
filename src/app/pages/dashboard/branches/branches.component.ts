import { Component, OnInit, inject, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { environment } from '../../../../environments/environment';
import { runInInjectionContext } from '@angular/core';
import { StoreSelectionService } from '../../../services/store-selection.service';
import { StorefrontPublicationService } from '../../../services/storefront-publication.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="branches-container">
      <div class="branches-header">
        <button
          type="button"
          (click)="goBackToProducts()"
          class="back-button"
        >
          <span aria-hidden="true">←</span> Back
        </button>
      </div>

      <div class="branches-hero">
        <p class="section-kicker">Available locations</p>
        <h1 class="branches-title">Select Branch</h1>
        <p class="branches-subtitle">Choose a store and branch for your pickup.</p>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading branches...</p>
        </div>
      } @else if (availableLocations().length === 0) {
        <div class="empty-state">
          <p class="empty-state-title">No active branches are available right now.</p>
          <p class="empty-state-text">Please check back later or create a branch for this company.</p>
        </div>
      } @else {
        <div class="branch-grid">
          @for (location of availableLocations(); track location.id) {
            <article class="branch-card-item" [class.selected]="location.id === selectedBranchId()">
              <div class="branch-header">
                <h2>{{ location.branchName }}</h2>
                <span class="status-badge" [class.open]="location.status === 'active'" [class.closed]="location.status !== 'active'">
                  {{ location.status === 'active' ? 'Open' : 'Closed' }}
                </span>
              </div>

              <div class="branch-address">
                <span class="location-pin" aria-hidden="true">◉</span>
                <span>{{ location.address }}</span>
              </div>

              <button type="button" class="text-link">See more</button>

              <div class="branch-hours">
                <span class="hours-icon" aria-hidden="true">◔</span>
                <span>{{ location.storeHours }}</span>
              </div>

              <button type="button" class="select-branch-button" (click)="selectBranch(location)">
                {{ selectedBranchId() === location.id ? 'Selected' : 'Select' }}
              </button>
            </article>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./branches.component.css']
})
export class BranchesComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private storeSelectionService = inject(StoreSelectionService);
  private storefrontPublication = inject(StorefrontPublicationService);

  protected availableLocations = signal<Array<{
    id: string;
    name: string;
    branchName: string;
    storeName: string;
    address: string;
    status: string;
    storeHours: string;
    storeId: string;
  }>>([]);
  protected isLoading = signal(false);
  protected selectedBranchId = signal<string>('');

  ngOnInit() {
    console.log('🌿 BranchesComponent: Initializing branches component');
    runInInjectionContext(this.injector, () => {
      this.loadData();
    });
  }

  protected goBackToProducts() {
    this.router.navigate(['/']);
  }

  protected selectBranch(location: { id: string; storeId: string; branchName: string; storeName: string }) {
    console.log('✅ BranchesComponent: Selected branch:', location);
    this.selectedBranchId.set(location.id);
    
    // Set the selected store in the service
    this.storeSelectionService.setSelectedStore(location.storeId);
    
    // Open the public product storefront for the selected branch.
    setTimeout(() => {
      this.router.navigate(['/store', location.storeId]);
    }, 300);
  }

  private async loadData() {
    this.isLoading.set(true);

    try {
      const companyIdOverride = this.route.snapshot.queryParamMap.get('companyId');
      const company = companyIdOverride
        ? { companyId: companyIdOverride }
        : await this.storefrontPublication.getCompanyBySlug(environment.companySlug);
      const companyId = company?.companyId || '';
      console.log('🌿 BranchesComponent: Loading branches for companyId:', companyId);

      if (!companyId) {
        console.warn('🌿 BranchesComponent: No companyId available');
        this.availableLocations.set([]);
        this.isLoading.set(false);
        return;
      }

      const storesRef = collection(this.firestore, 'storefront_stores');
      const storesQuery = query(
        storesRef,
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(storesQuery);
      const storeDocs = snapshot.docs;

      // Normalize the store data
      const normalized = storeDocs.map(docSnap => {
        const data = docSnap.data() as Record<string, any>;
        const address = this.formatAddress(data);
        const branchName = String(data['branchName'] || data['name'] || data['storeName'] || 'Main Branch');
        const storeName = String(data['storeName'] || data['name'] || 'Store');
        const rawStatus = data['status'] ?? data['isActive'];
        const status = rawStatus === 'active' || rawStatus === true ? 'active' : 'inactive';

        return {
          id: docSnap.id,
          name: branchName,
          branchName,
          storeName,
          address,
          status,
          storeHours: this.formatHours(data),
          storeId: docSnap.id
        };
      });

      console.log('🌿 BranchesComponent: Normalized locations:', {
        count: normalized.length,
        locations: normalized
      });

      this.availableLocations.set(normalized);
      this.isLoading.set(false);
    } catch (error) {
      console.error('🌿 BranchesComponent: Error loading branches:', error);
      this.availableLocations.set([]);
      this.isLoading.set(false);
    }
  }

  private formatAddress(data: Record<string, any>): string {
    const address = data?.['address'];
    if (address && typeof address === 'object') {
      const parts = [
        address['street'] || address['addressLine1'] || address['line1'],
        address['city'],
        address['state'],
        address['zipCode'] || address['postalCode'] || address['zip'],
        address['country']
      ].filter(Boolean);

      if (parts.length) {
        return parts.join(', ');
      }
    }

    const fallbackParts = [
      data?.['streetAddress'] || data?.['addressLine1'] || data?.['address1'],
      data?.['city'],
      data?.['state'],
      data?.['zipCode'] || data?.['postalCode'] || data?.['zip'],
      data?.['country']
    ].filter(Boolean);

    if (fallbackParts.length) {
      return fallbackParts.join(', ');
    }

    return data?.['address'] || data?.['location'] || 'Address unavailable';
  }

  private formatHours(data: Record<string, any>): string {
    const operatingHours = data?.['settings']?.['operatingHours'];
    if (Array.isArray(operatingHours) && operatingHours.length) {
      const openHours = operatingHours.filter((slot: any) => slot?.['isOpen'] && slot?.['openTime'] && slot?.['closeTime']);
      if (openHours.length) {
        const first = openHours[0];
        return `${first['openTime']} - ${first['closeTime']}`;
      }
    }

    const hours = data?.['storeHours'] || data?.['businessHours'] || data?.['openingHours'] || data?.['hours'];
    if (hours) {
      return String(hours);
    }

    return '24 Hours';
  }
}

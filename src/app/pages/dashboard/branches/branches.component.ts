import { Component, OnInit, inject, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';
import { Branch } from '../../../interfaces/branch.interface';
import { Store } from '../../../interfaces/store.interface';
import { environment } from '../../../../environments/environment';
import { runInInjectionContext } from '@angular/core';
import { StoreSelectionService } from '../../../services/store-selection.service';

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
  private authService = inject(AuthService);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private storeSelectionService = inject(StoreSelectionService);

  protected branches = signal<Branch[]>([]);
  protected stores = signal<Store[]>([]);
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
    
    // Navigate to product listing with the store ID
    setTimeout(() => {
      this.router.navigate(['/product-listing'], {
        queryParams: { storeId: location.storeId }
      });
    }, 300);
  }

  private async loadData() {
    this.isLoading.set(true);

    try {
      const companyId = environment.defaultCompanyId || this.authService.getCurrentPermission()?.companyId || '';
      console.log('🌿 BranchesComponent: Loading branches for companyId:', companyId);

      if (!companyId) {
        console.warn('🌿 BranchesComponent: No companyId available');
        this.availableLocations.set([]);
        this.isLoading.set(false);
        return;
      }

      // Try to load from top-level stores first
      let storeDocs: any[] = [];
      
      try {
        const storesRef = collection(this.firestore, 'stores');
        const storesQuery = query(storesRef, where('companyId', '==', companyId));
        const snapshot = await getDocs(storesQuery);
        
        console.log('🌿 BranchesComponent: Top-level stores query result:', {
          companyId,
          size: snapshot.size,
          docs: snapshot.docs.map(d => ({ id: d.id, data: d.data() }))
        });

        if (!snapshot.empty) {
          storeDocs = snapshot.docs;
        }
      } catch (error) {
        console.warn('🌿 BranchesComponent: Top-level stores query failed:', error);
      }

      // If no stores found at top level, try company-nested collection
      if (!storeDocs.length) {
        try {
          const companyStoresRef = collection(this.firestore, `companies/${companyId}/stores`);
          const snapshot = await getDocs(companyStoresRef);
          
          console.log('🌿 BranchesComponent: Company-nested stores query result:', {
            companyId,
            collectionPath: `companies/${companyId}/stores`,
            size: snapshot.size,
            docs: snapshot.docs.map(d => ({ id: d.id, data: d.data() }))
          });

          storeDocs = snapshot.docs;
        } catch (fallbackError) {
          console.warn('🌿 BranchesComponent: Company-nested stores query failed:', fallbackError);
        }
      }

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

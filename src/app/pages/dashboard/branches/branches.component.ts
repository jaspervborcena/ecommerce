import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
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
      } @else if (loadError()) {
        <div class="empty-state">
          <p class="empty-state-title">Could not load branches.</p>
          <p class="empty-state-text">{{ loadError() }}</p>
        </div>
      } @else if (availableLocations().length === 0) {
        <div class="empty-state">
          <p class="empty-state-title">No active branches are available right now.</p>
          <p class="empty-state-text">Please check back later for an available branch.</p>
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
  private storeSelectionService = inject(StoreSelectionService);
  private storefrontPublication = inject(StorefrontPublicationService);

  protected availableLocations = signal<Array<{
    id: string;
    branchId?: string;
    companyId: string;
    branchName: string;
    address: string;
    status: string;
    storeHours: string;
    storeId: string;
  }>>([]);
  protected isLoading = signal(false);
  protected loadError = signal('');
  protected selectedBranchId = signal<string>('');

  ngOnInit() {
    void this.loadData();
  }

  protected goBackToProducts() {
    this.router.navigate(['/']);
  }

  protected selectBranch(location: {
    id: string;
    branchId?: string;
    companyId: string;
    storeId: string;
    branchName: string;
  }) {
    console.log('✅ BranchesComponent: Selected branch:', location);
    this.selectedBranchId.set(location.id);
    
    // Set the selected store in the service
    this.storeSelectionService.setSelectedStore(location.storeId);
    
    // Open the public product storefront for the selected branch.
    setTimeout(() => {
      this.router.navigate(['/store', location.storeId], {
        queryParams: {
          branchId: location.branchId || '',
          companyId: location.companyId
        }
      });
    }, 300);
  }

  private async loadData() {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const companyIdOverride = this.route.snapshot.queryParamMap.get('companyId');
      const companyId = companyIdOverride ||
        environment.companyId ||
        (await this.storefrontPublication.getCompanyBySlug(environment.companySlug))?.companyId ||
        '';

      if (!companyId) {
        throw new Error('No companyId is available to load storefront branches.');
      }

      const locationsUrl = new URL(environment.api.storefrontLocationsApi);
      locationsUrl.searchParams.set('companyId', companyId);
      const response = await fetch(locationsUrl.toString());
      const responseBody = await response.json() as {
        locations?: Array<{
          id: string;
          branchId?: string;
          companyId: string;
          branchName: string;
          address: string;
          status: string;
          storeHours: string;
          storeId: string;
        }>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(responseBody.error || 'The branch list could not be loaded.');
      }

      this.availableLocations.set(responseBody.locations || []);
    } catch (error) {
      console.error('Could not load storefront branches.', error);
      this.loadError.set(error instanceof Error ? error.message : 'Please try again.');
    }
    this.isLoading.set(false);
  }

}

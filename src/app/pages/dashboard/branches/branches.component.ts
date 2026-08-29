import { Component, OnInit, inject, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { AuthService } from '../../../services/auth.service';
import { Branch } from '../../../interfaces/branch.interface';
import { Store } from '../../../interfaces/store.interface';
import { environment } from '../../../../environments/environment';
import { runInInjectionContext } from '@angular/core';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, ModalComponent],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <div class="mb-6 flex items-center justify-between">
        <button
          type="button"
          (click)="goBackToProducts()"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <button
          type="button"
          (click)="openModal()"
          class="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          Add Branch
        </button>
      </div>

      <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Available locations</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Select Branch</h1>
        <p class="mt-3 text-base text-slate-600">Choose a store and branch for your pickup.</p>
      </div>

      @if (isLoading()) {
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Loading branches...
        </div>
      } @else if (availableLocations().length === 0) {
        <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p class="text-lg font-semibold text-slate-800">No active branches are available right now.</p>
          <p class="mt-2 text-sm text-slate-600">Please check back later or create a branch for this company.</p>
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          @for (location of availableLocations(); track location.id) {
            <button
              type="button"
              (click)="selectBranch(location)"
              class="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              <div class="mb-4 flex items-center justify-between">
                <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {{ location.status | titlecase }}
                </span>
              </div>

              <h3 class="text-xl font-bold text-slate-900">{{ location.branchName }}</h3>
              <p class="mt-2 text-sm text-slate-600">{{ location.storeName }}</p>

              <div class="mt-4 space-y-2 text-sm text-slate-600">
                <p>{{ location.address }}</p>
                <p>{{ location.storeHours }}</p>
              </div>

              <div class="mt-5 flex items-center justify-between pt-4 border-t border-slate-200">
                <span class="text-sm font-medium text-slate-500">Pickup Point</span>
                <span class="text-sm font-semibold text-slate-900">Select</span>
              </div>
            </button>
          }
        </div>
      }

      <ui-modal [isOpen]="isModalOpen()" (close)="closeModal()" title="Branch Details">
        <form [formGroup]="branchForm" (ngSubmit)="saveBranch()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Branch Name</label>
              <input type="text" formControlName="name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Store</label>
              <select formControlName="storeId" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                <option value="">Select a store</option>
                @for (store of stores(); track store.id) {
                  <option [value]="store.id">{{ store.storeName }}</option>
                }
              </select>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Address</label>
              <div class="grid grid-cols-1 gap-3">
                <input type="text" formControlName="street" placeholder="Street Address" class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                <div class="grid grid-cols-2 gap-3">
                  <input type="text" formControlName="city" placeholder="City" class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                  <input type="text" formControlName="state" placeholder="State" class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <input type="text" formControlName="zipCode" placeholder="ZIP Code" class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                  <input type="text" formControlName="country" placeholder="Country" class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Business Type</label>
              <select formControlName="businessType" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                <option value="retail">Retail</option>
                <option value="restaurant">Restaurant</option>
                <option value="service">Service</option>
                <option value="convenience_store">Convenience Store</option>
                <option value="car_wash">Car Wash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <ui-button type="button" (click)="closeModal()" variant="secondary">Cancel</ui-button>
            <ui-button type="submit" variant="primary" [disabled]="!branchForm.valid || isLoading()">
              {{ editingBranch() ? 'Update' : 'Create' }} Branch
            </ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `
})
export class BranchesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private injector = inject(Injector);

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
  protected isModalOpen = signal(false);
  protected isLoading = signal(false);
  protected editingBranch = signal<Branch | null>(null);

  protected branchForm = this.fb.group({
    name: ['', [Validators.required]],
    storeId: ['', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    country: ['', [Validators.required]],
    businessType: ['retail', [Validators.required]]
  });

  ngOnInit() {
    console.log('🌿 BranchesComponent: Initializing branches component');
    runInInjectionContext(this.injector, () => {
      this.loadData();
    });
  }

  protected goBackToProducts() {
    this.router.navigate(['/dashboard/products']);
  }

  protected selectBranch(location: { id: string; branchName: string; storeName: string }) {
    console.log('✅ BranchesComponent: Selected branch:', location);
    this.router.navigate(['/dashboard/products']);
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

  protected openModal() {
    this.isModalOpen.set(true);
    this.branchForm.reset({ businessType: 'retail' });
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.editingBranch.set(null);
    this.branchForm.reset();
  }

  protected editBranch(branch: Branch) {
    this.editingBranch.set(branch);
    this.branchForm.patchValue({
      name: branch.name,
      storeId: branch.storeId,
      street: branch.address.street,
      city: branch.address.city,
      state: branch.address.state,
      zipCode: branch.address.zipCode,
      country: branch.address.country,
      businessType: branch.businessType
    });
    this.isModalOpen.set(true);
  }

  protected deleteBranch(branch: Branch) {
    if (confirm(`Are you sure you want to delete "${branch.name}"?`)) {
      // TODO: Implement delete functionality
    }
  }

  protected async saveBranch() {
    if (!this.branchForm.valid) return;

    this.isLoading.set(true);
    try {
      this.closeModal();
    } catch (error) {
      console.error('Error saving branch:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}

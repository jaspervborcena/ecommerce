import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { AppConstants } from '../../shared/enums';
import { NetworkService } from '../../core/services/network.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterLink, LogoComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private networkService = inject(NetworkService);

  // Expose authentication state to template (same as home component)
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;
  readonly userRole = this.authService.userRole;
  
  // Expose app constants and network status to template
  readonly isOnline = this.networkService.isOnline;
  readonly appName = computed(() => 
    this.isOnline() ? AppConstants.APP_NAME : AppConstants.APP_NAME_OFFLINE
  );
  readonly headerClass = computed(() => 
    this.isOnline() ? 'home-header' : 'home-header offline'
  );
  showPickupSchedule = false;
  scheduleForLater = false;
  pickupDate = '';
  showBranchSelection = false;
  availableBranches: Array<{
    id: string;
    branchName: string;
    address: string;
    status: 'active' | 'inactive' | 'suspended';
    storeHours: string;
  }> = [];
  selectedBranchId = '';

  continueToPickup() {
    this.showPickupSchedule = true;
  }

  backToOrderInformation() {
    this.showPickupSchedule = false;
    this.showBranchSelection = false;
    this.scheduleForLater = false;
  }

  selectScheduleOption(scheduleForLater: boolean) {
    this.scheduleForLater = scheduleForLater;
  }

  private formatBranchAddress(branchData: Record<string, any>): string {
    const address = branchData?.['address'];
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
      branchData?.['streetAddress'] || branchData?.['addressLine1'] || branchData?.['address1'],
      branchData?.['city'],
      branchData?.['state'],
      branchData?.['zipCode'] || branchData?.['postalCode'] || branchData?.['zip'],
      branchData?.['country']
    ].filter(Boolean);

    if (fallbackParts.length) {
      return fallbackParts.join(', ');
    }

    return branchData?.['address'] || branchData?.['location'] || 'Address unavailable';
  }

  private formatBranchHours(branchData: Record<string, any>): string {
    const operatingHours = branchData?.['settings']?.['operatingHours'];
    if (Array.isArray(operatingHours) && operatingHours.length) {
      const openHours = operatingHours.filter((slot: any) => slot?.['isOpen'] && slot?.['openTime'] && slot?.['closeTime']);
      if (openHours.length) {
        const first = openHours[0];
        return `${first['openTime']} - ${first['closeTime']}`;
      }
    }

    const hours = branchData?.['storeHours'] || branchData?.['businessHours'] || branchData?.['openingHours'] || branchData?.['hours'];
    if (hours) {
      return String(hours);
    }

    return '24 Hours';
  }

  continueToSelectBranch() {
    this.router.navigate(['/dashboard/branches']);
  }

  selectBranch(branchId: string) {
    this.selectedBranchId = branchId;
    this.router.navigate(['/dashboard/products']);
  }

  openDatePicker(datePicker: HTMLInputElement) {
    if (typeof datePicker.showPicker === 'function') {
      datePicker.showPicker();
    } else {
      datePicker.click();
    }
  }

  setPickupDate(event: Event) {
    const date = (event.target as HTMLInputElement).value;
    if (!date) {
      this.pickupDate = '';
      return;
    }

    const [year, month, day] = date.split('-');
    this.pickupDate = `${month}/${day}/${year}`;
  }

  navigateToDashboard() {
    const role = this.userRole();
    const currentUser = this.currentUser();
    const currentPermission = this.authService.getCurrentPermission();
    
    // Check if user has valid permissions (not visitor)
    const isVisitor = !currentPermission || 
                     !currentPermission.companyId || 
                     currentPermission.companyId.trim() === '' || 
                     currentPermission.roleId === 'visitor';
    
    if (isVisitor) {
      return;
    }
    
    this.router.navigate(['/dashboard']);
  }

  async logout() {
    await this.authService.logout();
  }

  // Check if user is a visitor
  isVisitorUser() {
    const currentPermission = this.authService.getCurrentPermission();
    return !currentPermission || 
           !currentPermission.companyId || 
           currentPermission.companyId.trim() === '' || 
           currentPermission.roleId === 'visitor';
  }

  // Debug method to test offline mode
  toggleOfflineMode() {
    const currentStatus = this.networkService.getCurrentStatus();
    this.networkService.setOfflineMode(currentStatus);
    setTimeout(() => {
      void this.isOnline();
      void this.headerClass();
      void this.appName();
    }, 200);
  }

  // Onboarding actions
  async navigateToCreateStore() {
  try {
    const currentPermission = this.authService.getCurrentPermission();
    const isVisitor = !currentPermission?.companyId || currentPermission.roleId === 'visitor';

    if (!isVisitor) {
      console.warn('🏪 Onboarding: User is not a visitor, redirecting to dashboard');
      await this.router.navigate(['/dashboard']);
      return;
    }

    await this.router.navigate(['/dashboard/company-profile']);
  } catch (error) {
    console.error('🏪 Onboarding: Error navigating to company profile:', error);
    await this.router.navigate(['/dashboard']);
  }
}

  async navigateToJoinStore() {
    try {
      await this.router.navigate(['/join-store']);
    } catch {
      await this.router.navigate(['/join-store']);
    }
  }
}

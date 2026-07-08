import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccessService } from '../../core/services/access.service';
import { ToastService } from '../../shared/services/toast.service';
import { ErrorMessages } from '../../shared/enums/notification-messages.enum';
import { OfflineNavigationService } from '../../core/services/offline-navigation.service';
import { NetworkService } from '../../core/services/network.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Sidebar for desktop -->
      <div class="dashboard-sidebar flex flex-col items-center">
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="flex-shrink-0 px-4 py-4 border-b border-gray-200 sidebar-header">
            <div class="flex items-center justify-between">
              <div class="font-bold text-2xl mb-4 flex items-center gap-2">
                Management
              </div>
            </div>
          </div>
          <!-- Navigation: Only show allowed links for cashier -->
          <nav class="flex-1 py-4 space-y-2 overflow-y-auto flex flex-col items-center">
            <a *ngIf="permissions.canViewCompanyProfile" 
               (click)="navigateTo('/dashboard/company-profile')" 
               [class.nav-link-active]="isCurrentRoute('/dashboard/company-profile')"
               class="nav-link flex flex-col items-center justify-center cursor-pointer" 
               title="Company Profile">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span class="ml-2">Company Profile</span>
              <span *ngIf="networkService.isOffline() && !offlineNavService.isRouteSafeOffline('/dashboard/company-profile')" class="text-xs text-orange-500">(Limited offline)</span>
            </a>
            <a *ngIf="permissions.canViewProducts" 
               (click)="navigateTo('/dashboard/products')" 
               [class.nav-link-active]="isCurrentRoute('/dashboard/products')"
               class="nav-link flex flex-col items-center justify-center cursor-pointer" 
               title="Products">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span class="ml-2">Products</span>
              <span *ngIf="networkService.isOffline() && !offlineNavService.isRouteSafeOffline('/dashboard/products')" class="text-xs text-orange-500">(Limited offline)</span>
            </a>
            <a
              (click)="navigateTo('/dashboard/storefront-settings')" 
              [class.nav-link-active]="isCurrentRoute('/dashboard/storefront-settings')"
              class="nav-link flex flex-col items-center justify-center cursor-pointer" 
              title="Storefront Settings">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7" />
              </svg>
              <span class="ml-2">Storefront</span>
            </a>
            <!-- ...existing code for full menu for other roles, using permissions checks... -->
          </nav>
          <!-- User Info -->
          <div class="flex-shrink-0 border-t border-gray-200 p-4" >
            ...existing code...
          </div>
        </div>
      </div>
      <!-- Top bar for mobile -->
  <nav class="dashboard-topbar fixed top-0 left-0 w-full bg-white shadow z-30 flex items-center justify-center px-2 py-1" style="height:56px;">
        <a (click)="navigateTo('/dashboard/overview')" 
           [class.nav-link-active]="isCurrentRoute('/dashboard/overview')"
           class="mx-2 flex flex-col items-center justify-center group cursor-pointer" 
           title="Overview">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
          <span class="text-[10px] group-hover:block hidden">Overview</span>
        </a>
        <!-- Add more mobile navigation items with safe navigation -->
      </nav>


  <!-- Main Content -->
  <div class="flex-1 flex flex-col lg:ml-64" >

        <!-- Content -->
        <main class="flex-1 overflow-auto">
          <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private accessService = inject(AccessService);
  private toastService = inject(ToastService);
  protected offlineNavService = inject(OfflineNavigationService);
  protected networkService = inject(NetworkService);
  user = this.authService.getCurrentUser();

  get permissions() {
    return this.accessService.permissions;
  }

  userInitials(): string {
    const name = this.user?.displayName || this.user?.email || '';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  async navigateTo(route: string): Promise<void> {
    try {
      await this.offlineNavService.navigateSafely(route);
    } catch (error) {
      console.error('Navigation error:', error);
      this.toastService.error('Navigation failed. Please try again.');
    }
  }

  isCurrentRoute(route: string): boolean {
    // Simple route matching - you might want to use Router.url for more complex matching
    return window.location.pathname === route;
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (err) {
      console.log('Logout error:', err);
      this.toastService.error(ErrorMessages.NETWORK_ERROR);
    }
  }
}

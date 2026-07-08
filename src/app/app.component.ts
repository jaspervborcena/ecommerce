import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ChunkErrorService } from './core/services/chunk-error.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <div *ngIf="isNavigating()" class="app-route-loader">
      <div class="app-route-progress"></div>
    </div>
    <main class="min-h-screen bg-gray-100">
      <router-outlet></router-outlet>
    </main>
    
    <!-- Global Toast Container -->
    <app-toast></app-toast>
  `,
  styles: [
    ".app-route-loader { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 9999; background: rgba(255,255,255,0.0); }",
    ".app-route-progress { width: 100%; height: 100%; background: linear-gradient(90deg, #4f46e5 0%, #a78bfa 100%); animation: appRouteProgress 1.2s ease-in-out infinite; }",
    "@keyframes appRouteProgress { 0% { transform: translateX(-100%); } 50% { transform: translateX(-15%); } 100% { transform: translateX(100%); } }"
  ]
})
export class AppComponent {
  title = 'Ecommerce System';
  protected isNavigating = signal(false);
  private router = inject(Router);
  private chunkErrorService = inject(ChunkErrorService);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
      }
    });
  }
}

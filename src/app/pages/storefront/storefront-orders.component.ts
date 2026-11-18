import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Firestore, collection, doc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

type StorefrontOrderStatus = 'REQUEST' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

interface StorefrontOrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface StorefrontOrder {
  id: string;
  customerName: string;
  email: string;
  notes: string;
  items: StorefrontOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  status: StorefrontOrderStatus;
  createdAt: string | null;
}

interface StoreOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  styles: [
    `.storefront-orders-shell { max-width: 90rem; margin: 0 auto; padding: 2rem 1.25rem; }
    .storefront-orders-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1.25rem; margin-bottom: 2rem; }
    .storefront-orders-title { margin: 0; color: #0f172a; font-size: 2rem; font-weight: 700; }
    .storefront-orders-subtitle { margin: 0.5rem 0 0; color: #64748b; }
    .storefront-store-select { display: grid; gap: 0.4rem; color: #334155; font-size: 0.875rem; font-weight: 600; }
    .storefront-store-select select { min-width: 16rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #fff; padding: 0.65rem 0.8rem; color: #0f172a; font: inherit; }
    .storefront-orders-message, .storefront-orders-empty { margin: 1.5rem 0; border-radius: 1rem; background: #f8fafc; padding: 1rem 1.25rem; color: #475569; }
    .storefront-orders-message.error { background: #fff1f2; color: #be123c; }
    .storefront-order-list { display: grid; gap: 1rem; }
    .storefront-order-card { border: 1px solid #e2e8f0; border-radius: 1.25rem; background: #fff; padding: 1.25rem; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
    .storefront-order-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
    .storefront-order-customer { margin: 0; color: #0f172a; font-size: 1.05rem; font-weight: 700; }
    .storefront-order-email, .storefront-order-date { margin-top: 0.25rem; color: #64748b; font-size: 0.875rem; overflow-wrap: anywhere; }
    .storefront-order-status { display: inline-flex; border-radius: 9999px; background: #fef3c7; padding: 0.35rem 0.75rem; color: #92400e; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.04em; }
    .storefront-order-status.accepted { background: #dbeafe; color: #1d4ed8; }
    .storefront-order-status.rejected { background: #ffe4e6; color: #be123c; }
    .storefront-order-status.completed { background: #dcfce7; color: #166534; }
    .storefront-order-items { display: grid; gap: 0.5rem; margin: 1rem 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 1rem 0; }
    .storefront-order-item, .storefront-order-total { display: flex; justify-content: space-between; gap: 1rem; color: #334155; }
    .storefront-order-total { font-weight: 800; }
    .storefront-order-notes { margin: 0.75rem 0 0; color: #475569; font-size: 0.9rem; }
    .storefront-order-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1rem; }
    .storefront-order-button { border: 0; border-radius: 0.75rem; padding: 0.65rem 0.9rem; color: #fff; font: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .storefront-order-button:disabled { cursor: progress; opacity: 0.6; }
    .storefront-order-button.accept { background: #4f46e5; }
    .storefront-order-button.reject { background: #e11d48; }
    .storefront-order-button.complete { background: #15803d; }
    @media (max-width: 600px) {
      .storefront-orders-shell { padding: 1.25rem 0.75rem; }
      .storefront-store-select, .storefront-store-select select { width: 100%; min-width: 0; }
    }`
  ],
  template: `
    <main class="storefront-orders-shell">
      <header class="storefront-orders-header">
        <div>
          <h1 class="storefront-orders-title">Online orders</h1>
          <p class="storefront-orders-subtitle">Accept, reject, and complete customer requests.</p>
        </div>
        <label class="storefront-store-select" *ngIf="stores().length > 0">
          Store
          <select [value]="selectedStoreId()" (change)="selectStore($event)">
            <option *ngFor="let store of stores()" [value]="store.id">{{ store.name }}</option>
          </select>
        </label>
      </header>

      <p *ngIf="message()" class="storefront-orders-message" [class.error]="hasError()">{{ message() }}</p>
      <p *ngIf="isLoading()" class="storefront-orders-empty">Loading online orders...</p>
      <p *ngIf="!isLoading() && !message() && orders().length === 0" class="storefront-orders-empty">
        No online orders have been submitted to this store.
      </p>

      <section class="storefront-order-list" *ngIf="!isLoading()">
        <article class="storefront-order-card" *ngFor="let order of orders()">
          <header class="storefront-order-header">
            <div>
              <h2 class="storefront-order-customer">{{ order.customerName || 'Customer' }}</h2>
              <div class="storefront-order-email">{{ order.email }}</div>
              <div class="storefront-order-date" *ngIf="order.createdAt">{{ order.createdAt | date:'medium' }}</div>
            </div>
            <span class="storefront-order-status" [class.accepted]="order.status === 'ACCEPTED'"
              [class.rejected]="order.status === 'REJECTED'" [class.completed]="order.status === 'COMPLETED'">
              {{ order.status }}
            </span>
          </header>

          <div class="storefront-order-items">
            <div class="storefront-order-item" *ngFor="let item of order.items">
              <span>{{ item.name }} × {{ item.quantity }}</span>
              <span>{{ item.subtotal | currency:(order.currency || 'PHP') }}</span>
            </div>
            <div class="storefront-order-total">
              <span>Total</span>
              <span>{{ order.total | currency:(order.currency || 'PHP') }}</span>
            </div>
          </div>

          <p class="storefront-order-notes" *ngIf="order.notes">Customer note: {{ order.notes }}</p>

          <div class="storefront-order-actions" *ngIf="order.status === 'REQUEST' || order.status === 'ACCEPTED'">
            <button *ngIf="order.status === 'REQUEST'" class="storefront-order-button accept"
              [disabled]="isUpdating() === order.id" (click)="changeStatus(order, 'ACCEPTED')">
              Accept request
            </button>
            <button *ngIf="order.status === 'REQUEST'" class="storefront-order-button reject"
              [disabled]="isUpdating() === order.id" (click)="changeStatus(order, 'REJECTED')">
              Reject
            </button>
            <button *ngIf="order.status === 'ACCEPTED'" class="storefront-order-button complete"
              [disabled]="isUpdating() === order.id" (click)="changeStatus(order, 'COMPLETED')">
              Mark completed
            </button>
          </div>
        </article>
      </section>
    </main>
  `
})
export class StorefrontOrdersComponent {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  readonly stores = signal<StoreOption[]>([]);
  readonly orders = signal<StorefrontOrder[]>([]);
  readonly selectedStoreId = signal('');
  readonly isLoading = signal(true);
  readonly isUpdating = signal('');
  readonly message = signal('');
  readonly hasError = signal(false);

  constructor() {
    void this.loadStores();
  }

  async loadStores(): Promise<void> {
    const permission = this.authService.getCurrentPermission();
    if (!permission?.companyId) {
      this.fail('Your account is not assigned to a company.');
      return;
    }

    try {
      if (permission.storeId) {
        const storeSnapshot = await getDoc(doc(this.firestore, 'stores', permission.storeId));
        if (!storeSnapshot.exists() || storeSnapshot.data()['companyId'] !== permission.companyId) {
          this.fail('Your assigned store could not be found.');
          return;
        }
        const storeData = storeSnapshot.data();
        this.stores.set([{
          id: storeSnapshot.id,
          name: [storeData['storeName'], storeData['branchName']].filter(Boolean).join(' · ')
        }]);
      } else {
        const storeQuery = query(
          collection(this.firestore, 'stores'),
          where('companyId', '==', permission.companyId)
        );
        const snapshot = await getDocs(storeQuery);
        this.stores.set(snapshot.docs.map(storeSnapshot => {
          const storeData = storeSnapshot.data();
          return {
            id: storeSnapshot.id,
            name: [storeData['storeName'], storeData['branchName']].filter(Boolean).join(' · ')
          };
        }));
      }

      const firstStoreId = this.stores()[0]?.id || '';
      if (!firstStoreId) {
        this.fail('No stores are available for this account.');
        return;
      }
      this.selectedStoreId.set(firstStoreId);
      await this.loadOrders();
    } catch (error) {
      console.error('Could not load stores for online orders.', error);
      this.fail('Could not load your stores. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectStore(event: Event): Promise<void> {
    const storeId = (event.target as HTMLSelectElement).value;
    this.selectedStoreId.set(storeId);
    await this.loadOrders();
  }

  async changeStatus(order: StorefrontOrder, status: StorefrontOrderStatus): Promise<void> {
    this.isUpdating.set(order.id);
    this.message.set('');
    this.hasError.set(false);
    try {
      await this.request(`${environment.api.storefrontOrdersApi}/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ storeId: this.selectedStoreId(), status })
      });
      await this.loadOrders();
      this.message.set(`Order updated to ${status}.`);
    } catch (error) {
      console.error('Could not update storefront order status.', error);
      this.fail(error instanceof Error ? error.message : 'Could not update the order.');
    } finally {
      this.isUpdating.set('');
    }
  }

  private async loadOrders(): Promise<void> {
    const storeId = this.selectedStoreId();
    if (!storeId) {
      this.orders.set([]);
      return;
    }

    this.isLoading.set(true);
    this.message.set('');
    this.hasError.set(false);
    try {
      const result = await this.request<{ orders: StorefrontOrder[] }>(
        `${environment.api.storefrontOrdersApi}?storeId=${encodeURIComponent(storeId)}`
      );
      this.orders.set(result.orders);
    } catch (error) {
      console.error('Could not load storefront orders.', error);
      this.orders.set([]);
      this.fail(error instanceof Error ? error.message : 'Could not load online orders.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = await this.authService.getFirebaseIdToken();
    if (!token) {
      throw new Error('Please sign in again to manage online orders.');
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers
      }
    });
    let payload: T & { error?: string };
    try {
      payload = await response.json() as T & { error?: string };
    } catch {
      throw new Error('The orders service returned an invalid response.');
    }
    if (!response.ok) {
      throw new Error(payload.error || 'The orders service could not complete the request.');
    }
    return payload;
  }

  private fail(message: string): void {
    this.message.set(message);
    this.hasError.set(true);
    this.isLoading.set(false);
  }
}

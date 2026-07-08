import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-storefront-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-0">
      <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-slate-900">Storefront Settings</h2>
            <p class="mt-2 text-sm text-slate-500">Configure storefront preview for your current active store and open the live storefront in one click.</p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <button class="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" (click)="openPreview()">
              Open Storefront Preview
            </button>
            <button class="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" (click)="openPreviewNewTab()">
              Open in New Tab
            </button>
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <h3 class="text-lg font-semibold text-slate-900">Preview</h3>
          <p class="mt-2 text-sm text-slate-500">Open a storefront preview using your current active store. The storefront view is built for product discovery and mobile-friendly browsing.</p>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <h3 class="text-lg font-semibold text-slate-900">Sample Embed Snippet</h3>
          <p class="mt-2 text-sm text-slate-500">Use this snippet on external pages to embed a minimal storefront buy button. Replace <code>YOUR_TOKEN</code> and <code>PRODUCT_ID</code>.</p>
          <pre class="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">&lt;!-- Tovrika Storefront Embed (minimal) --&gt;
&lt;div id="tovrika-buy-button" data-token="YOUR_TOKEN" data-product-id="PRODUCT_ID" data-store-id="{{ storeId() }}"&gt;&lt;/div&gt;
&lt;script src="http://localhost:4200/ecommerce-embed.js"&gt;&lt;/script&gt;</pre>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 md:col-span-2">
          <h3 class="text-lg font-semibold text-slate-900">Notes</h3>
          <ul class="mt-3 space-y-3 text-sm text-slate-600 pl-5 marker:text-indigo-600">
            <li>Token creation is done server-side. Use Cloud Function <code>/createToken</code> to issue tokens.</li>
            <li>External sites should call our ingestion endpoint or embed the hosted checkout widget.</li>
            <li>Embed widget support is currently a sample placeholder; the actual embed script needs to be implemented and hosted at <code>https://ecommerce.tovrika.com/ecommerce-embed.js</code>.</li>
            <li>For demos, the preview opens the internal storefront routes (read-only).</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class StorefrontSettingsComponent {
  private auth = inject(AuthService);
  storeId = computed(() => this.auth.getCurrentPermission()?.storeId || 'demo-store');

  openPreview() {
    const id = this.storeId();
    // navigate within the SPA to show storefront route
    window.location.href = `/store/${id}`;
  }

  openPreviewNewTab() {
    const id = this.storeId();
    window.open(`${window.location.origin}/store/${id}`, '_blank');
  }
}

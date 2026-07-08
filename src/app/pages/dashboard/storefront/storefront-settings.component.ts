import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-storefront-settings',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `.storefront-shell { max-width: 56rem; margin: 0 auto; padding: 0 1rem; }
    .storefront-panel { border: 1px solid #cbd5e1; border-radius: 1.75rem; background: #ffffff; padding: 1.5rem; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08); }
    .storefront-header { display: flex; flex-direction: column; gap: 1rem; }
    .storefront-actions { display: flex; flex-direction: column; gap: 0.75rem; }
    @media (min-width: 640px) { .storefront-actions { flex-direction: row; } }
    .storefront-cta { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.8rem 1.5rem; border-radius: 9999px; font-size: 0.95rem; font-weight: 600; border: 1px solid transparent; transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease; cursor: pointer; text-decoration: none; }
    .storefront-cta:hover { transform: translateY(-1px); }
    .storefront-cta.primary { background: #4f46e5; color: white; box-shadow: 0 14px 30px rgba(79, 70, 229, 0.15); }
    .storefront-cta.primary:hover { background: #4338ca; }
    .storefront-cta.secondary { background: #ffffff; color: #1f2937; border-color: #cbd5e1; }
    .storefront-cta.secondary:hover { background: #f8fafc; }
    .storefront-grid { display: grid; gap: 1rem; margin-top: 1.5rem; }
    @media (min-width: 768px) { .storefront-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .storefront-card { border: 1px solid #cbd5e1; border-radius: 1.75rem; background: #ffffff; padding: 1.5rem; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05); }
    .storefront-card h3 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    .storefront-card p { margin: 0.75rem 0 0; color: #475569; font-size: 0.95rem; line-height: 1.6; }
    .storefront-notes { margin-top: 0.75rem; color: #475569; font-size: 0.95rem; line-height: 1.7; }
    .storefront-notes li { margin-top: 0.65rem; }
    `
  ],
  template: `
    <div class="storefront-shell">
      <div class="storefront-panel">
        <div class="storefront-header">
          <div>
            <h2 class="text-2xl font-semibold text-slate-900">Storefront Settings</h2>
            <p class="mt-2 text-sm text-slate-500">Configure storefront preview for your current active store and open the live storefront in one click.</p>
          </div>
          <div class="storefront-actions">
            <button class="storefront-cta primary" (click)="openPreview()">Open Storefront Preview</button>
            <button class="storefront-cta secondary" (click)="openPreviewNewTab()">Open in New Tab</button>
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

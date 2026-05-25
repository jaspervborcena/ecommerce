import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-versions',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="p-4 max-w-5xl mx-auto">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm text-slate-500">App version</p>
          <h1 class="text-3xl font-semibold">Version notes</h1>
          <p class="mt-2 text-slate-600">Latest changelog and README content are shown below.</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Current version: <strong>{{ version }}</strong>
        </div>
      </div>

      <div *ngIf="isLoading" class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
        Loading version notes and documentation...
      </div>

      <div *ngIf="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 mb-6">
        {{ error }}
      </div>

      <div *ngIf="changelog" class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 class="text-2xl font-semibold mb-4">Version Changelog</h2>
        <pre class="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{{ changelog }}</pre>
      </div>

      <div *ngIf="readme" class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-2xl font-semibold mb-4">README / FAQ</h2>
        <pre class="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{{ readme }}</pre>
      </div>
    </section>
  `
})
export class VersionsComponent implements OnInit {
  public changelog = '';
  public readme = '';
  public isLoading = true;
  public error: string | null = null;
  public version = environment.version;

  private http = inject(HttpClient);
  private pendingLoads = 2;

  ngOnInit(): void {
    this.http.get('assets/versions.md', { responseType: 'text' })
      .subscribe({
        next: (text) => {
          this.changelog = text.trim();
          this.onLoadComplete();
        },
        error: (err) => {
          this.error = 'Could not load version notes. Please make sure assets/versions.md exists.';
          console.error('VersionsComponent versions load error:', err);
          this.onLoadComplete();
        }
      });

    this.http.get('assets/readme.md', { responseType: 'text' })
      .subscribe({
        next: (text) => {
          this.readme = text.trim();
          this.onLoadComplete();
        },
        error: (err) => {
          const message = 'Could not load README content. Please make sure assets/readme.md exists.';
          this.error = this.error ? `${this.error} ${message}` : message;
          console.error('VersionsComponent readme load error:', err);
          this.onLoadComplete();
        }
      });
  }

  private onLoadComplete(): void {
    this.pendingLoads -= 1;
    if (this.pendingLoads <= 0) {
      this.isLoading = false;
    }
  }
}

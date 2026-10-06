import { Component, signal } from '@angular/core';
import { PdfOptions, PdfViewerComponent } from 'ng-pdf-renderer';
import { formPdf, passwordPdf } from '../../../ng-pdf-renderer/src/testing/pdf-fixtures';

@Component({
  imports: [PdfViewerComponent],
  template: `
    <section aria-labelledby="feature-heading">
      <h2 id="feature-heading">PDF features</h2>
      <p>These local sample PDFs contain fillable fields, two pages, and nested bookmarks.</p>
      <div class="samples">
        <button type="button" (click)="open(false)">Forms and bookmarks</button>
        <button type="button" (click)="open(true)">Password-protected PDF</button>
      </div>
      @if (encrypted()) { <p>Sample password: <code>viewer-test</code>. Try an incorrect password first, or cancel.</p> }
      <p>Fill the fields, rotate or zoom, and download to keep the edits. Use thumbnails or bookmarks to switch pages.</p>
      @if (error()) { <p role="alert">{{ error() }}</p> }
      <ng-pdf-viewer [src]="source" [options]="options" (documentLoadError)="onError($event)" />
    </section>
  `,
  styles: [`
    section { padding:20px; max-width:1100px; margin:auto; }
    .samples { display:flex; flex-wrap:wrap; gap:10px; }
    button { padding:8px 14px; cursor:pointer; }
    code { background:#eee; padding:2px 5px; }
  `]
})
export class FeaturesDemoComponent {
  source = formPdf();
  options: PdfOptions = { height: '700px', initialZoom: 1, showControls: true, showThumbnails: true, showOutline: true };
  encrypted = signal(false);
  error = signal<string | null>(null);
  open(encrypted: boolean): void {
    this.error.set(null);
    this.encrypted.set(encrypted);
    this.source = encrypted ? passwordPdf() : formPdf();
  }
  onError(error: unknown): void { this.error.set(error instanceof Error ? error.message : 'PDF operation failed.'); }
}

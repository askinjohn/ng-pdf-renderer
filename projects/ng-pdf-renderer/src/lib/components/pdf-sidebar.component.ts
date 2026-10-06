import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AnnotationMode, type PDFDocumentProxy } from 'pdfjs-dist';
import { PdfOutlineItem } from '../models/pdf-options.model';

@Component({
  selector: 'ng-pdf-sidebar',
  imports: [NgTemplateOutlet],
  template: `
    <aside aria-label="Document navigation">
      @if (showOutline) {
        <details open>
          <summary>Bookmarks</summary>
          @if (outlineLoading()) { <p role="status">Loading bookmarks…</p> }
          @else if (outlineError()) { <p role="status">{{ outlineError() }}</p> }
          @else if (!outline().length) { <p>No bookmarks in this document.</p> }
          <ng-container *ngTemplateOutlet="tree; context: { $implicit: outline() }" />
        </details>
      }
      <ng-template #tree let-items>
        <ul class="outline">
          @for (item of items; track $index) {
            <li>
              @if (item.url) {
                <a [href]="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
              } @else {
                <button type="button" [disabled]="!item.dest" (click)="destinationChange.emit(item.dest)">{{ item.title }}</button>
              }
              @if (item.items.length) {
                <details open><summary>Sub-bookmarks of {{ item.title }}</summary>
                  <ng-container *ngTemplateOutlet="tree; context: { $implicit: item.items }" />
                </details>
              }
            </li>
          }
        </ul>
      </ng-template>
      @if (showThumbnails) {
        <h3>Pages</h3>
        <div #thumbnailList class="thumbnail-list" aria-label="Page thumbnails">
          @for (page of pages(); track page) {
            <button #thumbnail type="button" class="thumbnail" [attr.data-page-number]="page"
              [attr.aria-label]="'Go to page ' + page" [attr.aria-current]="page === currentPage ? 'page' : null"
              (click)="pageChange.emit(page)">
              @if (thumbnails()[page]) { <img [src]="thumbnails()[page]" alt="" /> }
              @else if (thumbnailErrors().has(page)) { <span>Preview unavailable</span> }
              @else { <span class="placeholder" aria-hidden="true">Preview</span> }
              <span>Page {{ page }}</span>
            </button>
          }
        </div>
      }
    </aside>
  `,
  styles: [`
    :host { display:block; width:180px; flex-shrink:0; border-right:1px solid #ddd; overflow:auto; background:#fafafa; }
    aside { padding:10px; }
    summary, button, a { cursor:pointer; }
    summary, h3 { font-size:14px; font-weight:600; }
    h3 { margin:14px 0 8px; }
    p { font-size:13px; }
    .outline { list-style:none; padding-left:12px; font-size:13px; }
    .outline button, .outline a { border:0; background:transparent; color:#174b8c; padding:5px 0; text-align:left; overflow-wrap:anywhere; }
    .outline summary { font-size:12px; font-weight:normal; }
    .thumbnail-list { display:flex; flex-direction:column; gap:10px; }
    .thumbnail { width:100%; min-height:100px; padding:8px; border:1px solid #ccc; border-radius:4px; background:white; display:flex; flex-direction:column; align-items:center; gap:6px; }
    .thumbnail[aria-current] { outline:2px solid #1769aa; }
    img { max-width:100%; max-height:160px; object-fit:contain; }
    .placeholder { height:90px; color:#777; display:grid; place-items:center; }
    button:focus-visible, a:focus-visible, summary:focus-visible { outline:2px solid #1769aa; outline-offset:2px; }
    @media (max-width:600px) { :host { width:130px; } }
  `]
})
export class PdfSidebarComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() document: PDFDocumentProxy | null = null;
  @Input() currentPage = 1;
  @Input() formRevision = 0;
  @Input() showThumbnails = false;
  @Input() showOutline = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() destinationChange = new EventEmitter<unknown>();
  @ViewChildren('thumbnail') private thumbnailElements!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('thumbnailList') private thumbnailList?: ElementRef<HTMLDivElement>;
  pages = signal<number[]>([]);
  thumbnails = signal<Record<number, string>>({});
  thumbnailErrors = signal<Set<number>>(new Set());
  outline = signal<PdfOutlineItem[]>([]);
  outlineLoading = signal(false);
  outlineError = signal<string | null>(null);
  private version = 0;
  private thumbnailVersion = 0;
  private observer?: IntersectionObserver;
  private tasks = new Set<{ cancel(): void }>();
  private queued = new Set<number>();
  private queue: number[] = [];
  private active = 0;
  private destroyed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document'] || changes['showThumbnails'] || changes['showOutline']) {
      this.reset();
      const document = this.document;
      this.pages.set(document && this.showThumbnails ? Array.from({ length: document.numPages }, (_, i) => i + 1) : []);
      if (document && this.showOutline) void this.loadOutline(document, this.version);
    } else if (changes['formRevision']) {
      this.resetThumbnails();
    }
    if (this.thumbnailElements && (changes['document'] || changes['showThumbnails'] || changes['showOutline'] || changes['formRevision'])) {
      queueMicrotask(() => { if (!this.destroyed) this.observeThumbnails(); });
    }
  }

  ngAfterViewInit(): void {
    this.observeThumbnails();
    this.thumbnailElements.changes.subscribe(() => this.observeThumbnails());
  }

  private reset(): void {
    ++this.version;
    this.resetThumbnails();
    this.outline.set([]);
    this.outlineError.set(null);
    this.outlineLoading.set(false);
  }

  private resetThumbnails(): void {
    ++this.thumbnailVersion;
    this.observer?.disconnect();
    this.tasks.forEach(task => task.cancel());
    this.tasks.clear();
    this.queue = [];
    this.queued.clear();
    this.thumbnails.set({});
    this.thumbnailErrors.set(new Set());
  }

  private async loadOutline(document: PDFDocumentProxy, version: number): Promise<void> {
    this.outlineLoading.set(true);
    try {
      const outline = await document.getOutline();
      if (version === this.version && !this.destroyed) this.outline.set(outline ?? []);
    } catch {
      if (version === this.version && !this.destroyed) this.outlineError.set('Bookmarks could not be loaded.');
    } finally {
      if (version === this.version && !this.destroyed) this.outlineLoading.set(false);
    }
  }

  private observeThumbnails(): void {
    this.observer?.disconnect();
    const root = this.thumbnailList?.nativeElement.closest('ng-pdf-sidebar');
    if (!root || this.destroyed) return;
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const page = Number((entry.target as HTMLElement).dataset['pageNumber']);
        this.observer?.unobserve(entry.target);
        if (!this.queued.has(page) && !this.thumbnails()[page]) {
          this.queued.add(page);
          this.queue.push(page);
        }
      }
      this.drainQueue();
    }, { root, rootMargin: '150px', threshold: 0 });
    this.thumbnailElements.forEach(element => this.observer!.observe(element.nativeElement));
  }

  private drainQueue(): void {
    // Keep thumbnail work bounded even for very large documents.
    while (this.active < 2 && this.queue.length && this.document && !this.destroyed) {
      const page = this.queue.shift()!;
      ++this.active;
      void this.renderThumbnail(this.document, page, this.thumbnailVersion).finally(() => {
        --this.active;
        this.drainQueue();
      });
    }
  }

  private async renderThumbnail(document: PDFDocumentProxy, pageNumber: number, version: number): Promise<void> {
    try {
      const page = await document.getPage(pageNumber);
      if (version !== this.thumbnailVersion || this.destroyed) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(140 / base.width, 160 / base.height) });
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      const task = page.render({ canvas, canvasContext: context, viewport, annotationMode: AnnotationMode.ENABLE_STORAGE });
      this.tasks.add(task);
      try { await task.promise; } finally { this.tasks.delete(task); }
      if (version === this.thumbnailVersion && !this.destroyed) this.thumbnails.update(images => ({ ...images, [pageNumber]: canvas.toDataURL() }));
      canvas.width = canvas.height = 0;
    } catch {
      if (version === this.thumbnailVersion && !this.destroyed) this.thumbnailErrors.update(errors => new Set([...errors, pageNumber]));
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.reset();
  }
}

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, PLATFORM_ID, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { PdfService } from '../services/pdf.service';
import { PdfSidebarComponent } from './pdf-sidebar.component';
import { PdfControlsComponent } from './pdf-controls.component';
import { PdfOptions, PdfPasswordRequest } from '../models/pdf-options.model';

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';
// REMOVED: import 'pdfjs-dist/web/pdf_viewer.css'; - This is handled in the CSS file

let nextViewerId = 0;

/**
 * Main component for rendering PDFs
 * Uses modern Angular patterns including standalone components and signals
 */
@Component({
  selector: 'ng-pdf-viewer',
  standalone: true,  // Modern Angular standalone component (no NgModule needed)
  providers: [PdfService],
  imports: [CommonModule, PdfControlsComponent, PdfSidebarComponent],  // Import dependencies
  template: `
    <!-- Main container with configurable dimensions -->
    <div class="pdf-container" [style.width]="options?.width || '100%'" [style.height]="options?.height || '500px'">
      <!-- Controls bar - conditionally shown based on options -->
      @if (options?.showControls === true) { <ng-pdf-controls
        [currentPage]="currentPage()"
        [totalPages]="totalPages()"
        [zoom]="zoom()"
        [rotation]="rotation()"
        [showNavigation]="options.showNavigation !== false"
        [showZoomControls]="options.showZoomControls !== false"
        [showRotationControls]="options.showRotationControls !== false"
        [showDownloadButton]="options.showDownloadButton !== false"
        [showPrintButton]="options.showPrintButton !== false"
        [showSearchBar]="options.showSearchBar !== false"
        [showThumbnails]="thumbnailsVisible()"
        [showOutline]="outlineVisible()"
        (pageChange)="onPageChange($event)"
        (zoomChange)="onZoomChange($event)"
        (rotationChange)="onRotationChange($event)"
        (download)="onDownload()"
        (print)="onPrint()"
        (search)="onSearch($event)"
        (toggleThumbnails)="thumbnailsVisible.set($event)"
        (toggleOutline)="outlineVisible.set($event)"
        [attr.inert]="passwordRequest() ? '' : null">
      </ng-pdf-controls> }
      
      <div class="pdf-body" [attr.inert]="passwordRequest() ? '' : null">
        @if (thumbnailsVisible() || outlineVisible()) {
          <ng-pdf-sidebar [document]="pdfDocument()" [currentPage]="currentPage()"
            [showThumbnails]="thumbnailsVisible()" [formRevision]="formRevision()" [showOutline]="outlineVisible()"
            (pageChange)="onPageChange($event)" (destinationChange)="onDestinationChange($event)" />
        }
        <div class="pdf-viewer" tabindex="0" aria-label="PDF document">
          @if (loading()) { <div class="pdf-loading" role="status">Loading…</div> }
          @if (error()) { <div class="pdf-error" role="alert">{{ error() }}</div> }
          <div class="pdf-content"><div #canvasContainer></div></div>
        </div>
      </div>
      @if (passwordRequest(); as request) {
        <div class="password-backdrop">
          <form class="password-dialog" role="dialog" aria-modal="true" aria-label="Unlock PDF"
            (submit)="onPasswordSubmit($event, passwordInput)" (keydown)="onPasswordKeydown($event)">
            <h2>Unlock PDF</h2>
            <p>{{ request.incorrect ? 'Incorrect password. Please try again.' : 'This document requires a password.' }}</p>
            <label>Password <input #passwordInput type="password" name="pdfPassword" autocomplete="off" required
              [attr.aria-invalid]="request.incorrect" /></label>
            <div class="password-actions">
              <button type="submit">Unlock</button>
              <button type="button" (click)="cancelPassword()">Cancel</button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display:block; min-width:0; color:#1e293b; font-family:system-ui, sans-serif; }
    /* Container styling */
    .pdf-container {
      position: relative;
      display: flex;
      flex-direction: column;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #fff;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
    }
    
    .pdf-body { display:flex; flex:1; min-height:0; }
    .password-backdrop { position:absolute; inset:0; z-index:100; background:rgb(0 0 0 / .3); display:grid; place-items:center; }
    .password-dialog { background:white; padding:24px; border-radius:8px; width:min(320px, calc(100% - 60px)); box-shadow:0 6px 30px rgb(0 0 0 / .3); }
    .password-dialog h2 { margin:0 0 12px; font-size:20px; }
    .password-dialog label { display:flex; flex-direction:column; gap:6px; }
    .password-dialog input { padding:8px; font:inherit; }
    .password-actions { display:flex; gap:8px; margin-top:16px; }
    .password-actions button { padding:8px 16px; cursor:pointer; }
    /* PDF viewer area */
    .pdf-viewer {
      min-width:0;
      flex: 1;
      overflow: auto;
      position: relative;
      background-color: #f5f5f5;
    }
    
    /* Content container with transition for smooth rotation */
    .pdf-content {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      transition: transform 0.3s ease;
      width: 100%;
      min-height: 100%;
      padding: 20px;
      box-sizing: border-box;
      overflow-x: auto; /* Allow horizontal scrolling if needed */
    }
    
    /* Loading and error message styling */
    .pdf-loading, .pdf-error {
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-color: rgba(255, 255, 255, 0.8);
    }
    
    .pdf-error {
      color: red;
    }
    
    /* Canvas and Page styling */
    :host ::ng-deep .pdf-page {
      position: relative;
      margin: 10px 0;
    }
    
    :host ::ng-deep .pdf-page canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
    
    /* Annotation layer styling */
    :host ::ng-deep .annotationLayer {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      z-index: 3;
    }
    
    :host ::ng-deep .annotationLayer section {
      position: absolute;
    }
    
    :host ::ng-deep .annotationLayer .linkAnnotation > a {
      position: absolute;
      font-size: 1em;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      z-index: 3;
    }
    
    :host ::ng-deep .annotationLayer .buttonWidgetAnnotation.pushButton > a {
      background-color: #0066ff;
      background-clip: padding-box;
      border: 2px solid #000;
      border-radius: 6px;
      color: white;
      display: inline-block;
      padding: 4px 8px;
      cursor: pointer;
      position: relative;
      text-decoration: none;
    }

    :host ::ng-deep .textLayer[data-main-rotation="90"] { transform: rotate(90deg) translateY(-100%); }
    :host ::ng-deep .textLayer[data-main-rotation="180"] { transform: rotate(180deg) translate(-100%, -100%); }
    :host ::ng-deep .textLayer[data-main-rotation="270"] { transform: rotate(270deg) translateX(-100%); }
    :host ::ng-deep .textLayer {
      --min-font-size: 1;
      --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
      --min-font-size-inv: calc(1 / var(--min-font-size));
    }
    :host ::ng-deep .textLayer > :not(.markedContent),
    :host ::ng-deep .textLayer .markedContent span:not(.markedContent) {
      --font-height: 0;
      --scale-x: 1;
      --rotate: 0deg;
      font-size: calc(var(--text-scale-factor) * var(--font-height));
      transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
    }
    :host ::ng-deep .textLayer .markedContent { display: contents; }

    :host ::ng-deep .pdf-form-layer {
      position:absolute; inset:0; z-index:12; pointer-events:none; transform-origin:0 0;
    }
    :host ::ng-deep .pdf-form-layer section { position:absolute; pointer-events:auto; box-sizing:border-box; transform-origin:0 0; }
    :host ::ng-deep .pdf-form-layer :is(input, textarea, select) {
      width:100%; height:100%; margin:0; padding:2px; box-sizing:border-box; pointer-events:auto;
      border:1px solid #8a9fb5; background:rgb(225 239 255 / .7); font:calc(12px * var(--total-scale-factor)) sans-serif;
    }
    :host ::ng-deep .pdf-form-layer textarea { resize:none; }
    :host ::ng-deep .pdf-form-layer :is(input, textarea, select):focus-visible { outline:2px solid #1769aa; background:white; }
    :host ::ng-deep .pdf-form-layer :is(input, textarea, select):disabled { background:transparent; color:#555; }
    :host ::ng-deep .pdf-form-layer :is(input[type=checkbox], input[type=radio]) { accent-color:#1769aa; }
    :host ::ng-deep .pdf-form-layer [data-canvas-name] { display:none; }
    :host ::ng-deep .pdf-form-layer[data-main-rotation="90"] { transform:rotate(90deg) translateY(-100%); }
    :host ::ng-deep .pdf-form-layer[data-main-rotation="180"] { transform:rotate(180deg) translate(-100%, -100%); }
    :host ::ng-deep .pdf-form-layer[data-main-rotation="270"] { transform:rotate(270deg) translateX(-100%); }

    /* ENHANCED Text layer styling - CRITICAL for proper alignment and interaction */
    :host ::ng-deep .pdf-page .textLayer,
    :host ::ng-deep div.textLayer {
      position: absolute !important;
      text-align: initial !important;
      left: 0 !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      overflow: hidden !important;
      /* Production settings - text invisible but selectable */
      opacity: 1 !important;
      line-height: 1 !important;
      -webkit-text-size-adjust: none !important;
      -moz-text-size-adjust: none !important;
      -ms-text-size-adjust: none !important;
      text-size-adjust: none !important;
      forced-color-adjust: none !important;
      transform-origin: 0 0 !important;
      /* MAXIMUM z-index to override PDF.js defaults */
      z-index: 10 !important;
      /* CRITICAL: Ensure text layer receives pointer events */
      pointer-events: auto !important;
    }

    :host ::ng-deep .textLayer span,
    :host ::ng-deep .textLayer br {
      /* Production settings - make text transparent */
      color: transparent !important;
      position: absolute !important;
      white-space: pre !important;
      cursor: text !important;
      transform-origin: 0% 0% !important;
      /* Ensure spans receive pointer events */
      pointer-events: auto !important;
      /* Ensure spans stay on top */
      z-index: 10 !important;
    }

    /* Enhanced text selection styling - CRITICAL for visible selection */
    :host ::ng-deep .textLayer ::selection {
      background: rgba(0, 100, 255, 0.3) !important;
      color: rgba(0, 100, 255, 0.3) !important;
    }

    :host ::ng-deep .textLayer ::-moz-selection {
      background: rgba(0, 100, 255, 0.3) !important;
      color: rgba(0, 100, 255, 0.3) !important;
    }
    
    /* Additional selection fallbacks */
    :host ::ng-deep .textLayer span::selection {
      background: rgba(0, 100, 255, 0.3) !important;
    }
    
    :host ::ng-deep .textLayer span::-moz-selection {
      background: rgba(0, 100, 255, 0.3) !important;
    }

    /* Ensure text layer is properly sized */
    :host ::ng-deep .textLayer .endOfContent {
      display: block;
      position: absolute;
      left: 0;
      top: 100%;
      right: 0;
      bottom: 0;
      z-index: -1;
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    :host ::ng-deep .textLayer .highlight {
      margin: -1px;
      padding: 1px;
      background-color: rgba(180, 0, 170, 0.4);
      border-radius: 4px;
    }

    :host ::ng-deep .textLayer .highlight.selected {
      background-color: rgba(0, 100, 0, 0.4);
    }
  `]
})
export class PdfViewerComponent implements OnInit, OnDestroy, OnChanges {
  // Input properties
  @Input() src!: string | Uint8Array;  // Source URL or binary data for the PDF
  @Input() options?: PdfOptions;       // Configuration options

  // Output events
  @Output() pageChange = new EventEmitter<number>();          // Emitted when page changes
  @Output() documentLoaded = new EventEmitter<any>();         // Emitted when document loads
  @Output() documentLoadError = new EventEmitter<any>();      // Emitted on load error

  // Reference to the canvas container
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  // Service injection using modern inject function
  private pdfService = inject(PdfService);

  // Subject for handling unsubscription on component destroy
  private destroy$ = new Subject<void>();

  // Component state using signals (reactive primitive in modern Angular)
  currentPage = signal<number>(1);         // Current page number
  totalPages = signal<number>(0);          // Total pages in document
  zoom = signal<number>(1);                // Current zoom level
  rotation = signal<number>(0);            // Current rotation in degrees
  loading = signal<boolean>(false);        // Loading state
  error = signal<string | null>(null);     // Error message if any

  // Keep track of current render task to cancel if needed
  private renderTasks = new Set<any>();
  private readonly formIdPrefix = `ngpdf-${++nextViewerId}-`;
  private fieldObjects = new WeakMap<pdfjsLib.PDFDocumentProxy, Promise<Map<string, object[]> | null>>();
  private annotationLayers = new Set<pdfjsLib.AnnotationLayer>();
  private observers: IntersectionObserver[] = [];
  private renderVersion = 0;
  private loadVersion = 0;
  private initialized = false;
  private destroyed = false;
  private autoFit = true;
  private resizeObserver?: ResizeObserver;
  private platformId = inject(PLATFORM_ID);
  private searchText = '';
  private searchVersion = 0;
  pdfDocument = signal<pdfjsLib.PDFDocumentProxy | null>(null);
  thumbnailsVisible = signal(false);
  formRevision = signal(0);
  outlineVisible = signal(false);
  passwordRequest = signal<PdfPasswordRequest | null>(null);
  @ViewChild('passwordInput') set passwordInput(element: ElementRef<HTMLInputElement> | undefined) {
    if (element) queueMicrotask(() => { if (!this.destroyed) element.nativeElement.focus(); });
  }

  onPasswordSubmit(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    this.pdfService.submitPassword(value);
  }

  onPasswordKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.preventDefault(); void this.cancelPassword(); return; }
    if (event.key !== 'Tab') return;
    const form = event.currentTarget as HTMLFormElement;
    const controls = Array.from(form.querySelectorAll<HTMLElement>('input, button'));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  async cancelPassword(): Promise<void> {
    const version = ++this.loadVersion;
    await this.pdfService.clearDocument();
    if (!this.destroyed && version === this.loadVersion) {
      this.passwordRequest.set(null);
      this.loading.set(false);
      this.error.set('PDF loading cancelled.');
    }
  }

  onDestinationChange(destination: unknown): void {
    void this.pdfService.getLinkService().navigateTo(destination).catch((error: unknown) => this.documentLoadError.emit(error));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['src']) {
      this.autoFit = this.options?.autoFit !== false && !this.options?.initialZoom;
      void this.loadDocument();
    } else if (changes['options']) {
      this.autoFit = this.options?.autoFit !== false && !this.options?.initialZoom;
      this.thumbnailsVisible.set(this.options?.showThumbnails === true);
      this.outlineVisible.set(this.options?.showOutline === true);
      if (this.options?.initialZoom) this.pdfService.setZoom(this.options.initialZoom);
      if (this.pdfService.getCurrentDocument()) void this.renderAllPages();
    }
  }

  private cancelRendering(): void {
    ++this.renderVersion;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.renderTasks.forEach(task => task.cancel());
    this.renderTasks.clear();
    this.annotationLayers.forEach(layer => layer.destroy());
    this.annotationLayers.clear();
  }

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initialized = true;
    this.pdfService.passwordRequest$.pipe(takeUntil(this.destroy$)).subscribe(request => this.passwordRequest.set(request));
    this.pdfService.pdfDocument$.pipe(takeUntil(this.destroy$)).subscribe(document => this.pdfDocument.set(document));
    this.autoFit = this.options?.autoFit !== false && !this.options?.initialZoom;
    this.pdfService.getLinkService().setViewer({
      scrollPageIntoView: ({ pageNumber }: { pageNumber: number }) => this.onPageChange(pageNumber)
    });
    if (typeof ResizeObserver !== 'undefined') {
      let previousWidth = 0;
      this.resizeObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width;
        if (width && width !== previousWidth) {
          previousWidth = width;
          if (this.autoFit && this.pdfService.getCurrentDocument() && !this.loading()) void this.renderAllPages();
        }
      });
      this.resizeObserver.observe(this.canvasContainer.nativeElement);
    }


    // Apply initial options if provided
    if (this.options?.initialZoom) {

      this.zoom.set(this.options.initialZoom);
      this.pdfService.setZoom(this.options.initialZoom);
    } else {
      // Default to 1.0 (100%) - let autoFit handle the scaling if needed
      this.zoom.set(1.0);
      this.pdfService.setZoom(1.0);
    }

    if (this.options?.initialPage) {

      this.currentPage.set(this.options.initialPage);
      this.pdfService.setCurrentPage(this.options.initialPage);
    }

    // Subscribe to service observables and update component state
    // The takeUntil operator automatically unsubscribes when destroy$ emits
    this.pdfService.currentPage$.pipe(takeUntil(this.destroy$))
      .subscribe(page => {

        this.currentPage.set(page);
        this.pageChange.emit(page);
      });

    this.pdfService.totalPages$.pipe(takeUntil(this.destroy$))
      .subscribe(totalPages => {

        this.totalPages.set(totalPages);
      });

    this.pdfService.zoom$.pipe(takeUntil(this.destroy$))
      .subscribe(zoom => {
        // Only update and re-render if the zoom level has actually changed
        // This prevents double-rendering loops when autoFit updates the zoom internally
        if (Math.abs(this.zoom() - zoom) > 0.001) {
          this.zoom.set(zoom);
          // Re-render all pages when zoom changes
          if (this.pdfService.getCurrentDocument() && !this.loading()) {
            this.renderAllPages();
          }
        }
      });

    this.pdfService.rotation$.pipe(takeUntil(this.destroy$))
      .subscribe(rotation => {
        // Only update if rotation has changed
        if (this.rotation() !== rotation) {
          this.rotation.set(rotation);
          // Re-render all pages when rotation changes
          if (this.pdfService.getCurrentDocument() && !this.loading()) {
            this.renderAllPages();
          }
        }
      });

    // Load the document
    this.loadDocument();
  }

  /**
   * Clean up subscriptions on component destruction
   */
  ngOnDestroy(): void {
    this.destroyed = true;
    ++this.loadVersion;
    ++this.searchVersion;
    this.cancelRendering();
    this.resizeObserver?.disconnect();

    // Complete the destroy subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load the PDF document
   */
  private async loadDocument(): Promise<void> {
    const version = ++this.loadVersion;
    ++this.searchVersion;
    this.cancelRendering();
    this.canvasContainer.nativeElement.innerHTML = '';
    this.pdfDocument.set(null);
    this.formRevision.set(0);
    this.thumbnailsVisible.set(this.options?.showThumbnails === true);
    this.outlineVisible.set(this.options?.showOutline === true);
    if (!this.src) {
      await this.pdfService.clearDocument();
      this.loading.set(false);
      this.error.set('No PDF source provided');
      return;
    }

    if (this.options?.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = this.options.workerSrc;
    this.searchText = '';
    this.loading.set(true);
    this.error.set(null);
    this.pdfService.setZoom(this.options?.initialZoom || 1);

    //console.log(`Loading PDF from source: ${typeof this.src === 'string' ? this.src : 'Binary data'}`);

    try {
      // Use service to load the document
      const pdfDocument = await this.pdfService.loadDocument(this.src);
      //console.log('PDF document loaded successfully!', pdfDocument);
      if (this.destroyed || version !== this.loadVersion) return;
      this.pdfDocument.set(pdfDocument);
      this.documentLoaded.emit(pdfDocument);

      // Set total pages
      this.totalPages.set(pdfDocument.numPages);
      //console.log(`Total pages: ${pdfDocument.numPages}`);

      // Set current page to 1 or initialPage
      const initialPage = Math.max(1, Math.min(pdfDocument.numPages, Math.floor(this.options?.initialPage || 1)));
      this.currentPage.set(initialPage);
      this.pdfService.setCurrentPage(initialPage);

      // Render all pages in continuous mode
      await this.renderAllPages();
      if (!this.destroyed && version === this.loadVersion) this.onPageChange(initialPage);
    } catch (err: any) {
      //console.error('Error loading PDF:', err);
      if (this.destroyed || version !== this.loadVersion) return;
      this.error.set(err.message || 'Failed to load PDF');
      this.documentLoadError.emit(err);
    } finally {
      if (!this.destroyed && version === this.loadVersion) this.loading.set(false);
    }
  }

  /**
   * Render all pages of the PDF using lazy loading
   * Creates placeholders first, then renders content as pages come into view
   */
  private async renderAllPages(): Promise<void> {
    this.cancelRendering();
    const version = this.renderVersion;
    const rotation = this.rotation();
    // Get the document directly from the service
    const pdfDocument = this.pdfService.getCurrentDocument();

    if (!pdfDocument) {
      return;
    }

    // Auto-scale to fit the container width if needed
    try {
      if (this.autoFit) {
        const container = this.canvasContainer.nativeElement;
        const containerWidth = container.clientWidth || 800; // Fallback to 800 if clientWidth is 0
        const firstPage = await pdfDocument.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0, rotation: (firstPage.rotate + rotation) % 360 });
        if (this.destroyed || version !== this.renderVersion) return;
        const pageWidth = viewport.width;

        // Calculate scale to fit container width (with some margin)
        const scaleFactor = (containerWidth - 40) / pageWidth;

        // Apply reasonable bounds to prevent extreme scaling
        const boundedScale = Math.max(0.1, Math.min(scaleFactor, 3.0));

        // Only update if significantly different from current zoom (increased threshold to prevent loops)
        // Note: The subscription guard in ngOnInit protects against loops, but we check here too
        if (Math.abs(boundedScale - this.zoom()) > 0.01) {
          // Update local state immediately to use in this render pass
          this.zoom.set(boundedScale);
          // And notify service
          this.pdfService.setZoom(boundedScale);
        }
      }
    } catch (err) {
      //console.error('Error in auto-scaling:', err);
      // Set a reasonable default zoom level if auto-scaling fails
      this.zoom.set(1.0);
      this.pdfService.setZoom(1.0);
    }

    if (this.destroyed || version !== this.renderVersion) return;
    const totalPages = pdfDocument.numPages;

    // Clear the canvas container
    const container = this.canvasContainer.nativeElement;
    container.innerHTML = '';


    // Calculate scale based on zoom
    const scale = this.zoom();

    // Setup intersection observer for lazy loading
    // Root margin of 200px means we start loading when the page is 200px away from viewport
    const lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageElement = entry.target as HTMLElement;
          const pageNumber = parseInt(pageElement.getAttribute('data-page-number') || '0', 10);

          if (pageNumber > 0 && !pageElement.classList.contains('rendered')) {
            // Stop observing once we start rendering
            lazyLoadObserver.unobserve(pageElement);
            void this.renderPageContent(pageElement, pageNumber, scale, version);
          }
        }
      });
    }, {
      root: this.canvasContainer.nativeElement.closest('.pdf-viewer'),
      rootMargin: '500px 0px', // Render somewhat ahead of scrolling
      threshold: 0.01
    });

    // Track the page with the largest visible area, including pages taller than the viewport.
    const visiblePages = new Set<HTMLElement>();
    const scrollRoot = container.closest('.pdf-viewer');
    const pageNumberObserver = new IntersectionObserver(entries => {
      if (this.destroyed || version !== this.renderVersion) return;
      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) visiblePages.add(element);
        else visiblePages.delete(element);
      });
      const rootBounds = scrollRoot?.getBoundingClientRect();
      if (!rootBounds) return;
      let bestPage = 0;
      let bestHeight = 0;
      visiblePages.forEach(element => {
        const bounds = element.getBoundingClientRect();
        const height = Math.max(0, Math.min(bounds.bottom, rootBounds.bottom) - Math.max(bounds.top, rootBounds.top));
        const pageNumber = Number(element.dataset['pageNumber']);
        if (height > bestHeight || (height === bestHeight && pageNumber < bestPage)) {
          bestHeight = height;
          bestPage = pageNumber;
        }
      });
      if (bestPage > 0 && bestPage !== this.currentPage()) this.pdfService.setCurrentPage(bestPage);
    }, { root: scrollRoot, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    this.observers.push(lazyLoadObserver, pageNumberObserver);

    // Create placeholders for all pages
    // We process this sequentially to maintain order in DOM, but it's fast since we just make divs
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      try {
        // We need at least the viewbox to size the placeholder correctly
        // This is the "costly" part of the loop, fetching metadata for every page
        const page = await pdfDocument.getPage(pageNumber);

        if (this.destroyed || version !== this.renderVersion) return;
        // Create viewport with current zoom and rotation
        const viewport = page.getViewport({
          scale: scale,
          rotation: (page.rotate + this.rotation()) % 360
        });

        // Create page container (Placeholder)
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.style.margin = '10px auto';
        pageContainer.style.position = 'relative';
        pageContainer.style.overflow = 'hidden';
        pageContainer.style.backgroundColor = '#fff';
        pageContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)'; // Nice visible placeholder

        // Set dimensions explicitly
        const width = Math.floor(viewport.width);
        const height = Math.floor(viewport.height);

        pageContainer.style.width = width + 'px';
        pageContainer.style.height = height + 'px';
        pageContainer.style.display = 'block';
        pageContainer.setAttribute('data-page-number', pageNumber.toString());

        // Add loading indicator to placeholder
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'page-loading-indicator';
        loadingIndicator.textContent = `Page ${pageNumber}`;
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.alignItems = 'center';
        loadingIndicator.style.justifyContent = 'center';
        loadingIndicator.style.height = '100%';
        loadingIndicator.style.color = '#999';
        pageContainer.appendChild(loadingIndicator);

        // Add to main container
        container.appendChild(pageContainer);

        // Associate this page with our observers
        lazyLoadObserver.observe(pageContainer);
        pageNumberObserver.observe(pageContainer);

      } catch (err: any) {
        //console.error(`Error creating placeholder for page ${pageNumber}:`, err);
      }
    }
  }

  /**
   * Renders the actual content (canvas, text, annotations) for a specific page
   * securely only when needed.
   */
  private async renderPageContent(pageContainer: HTMLElement, pageNumber: number, scale: number, version = this.renderVersion): Promise<void> {
    try {
      // Mark as rendering/rendered to prevent double calls
      pageContainer.classList.add('rendered');

      const pdfDocument = this.pdfService.getCurrentDocument();
      if (!pdfDocument) return;

      const page = await pdfDocument.getPage(pageNumber);
      if (this.destroyed || version !== this.renderVersion) return;
      const viewport = page.getViewport({
        scale: scale,
        rotation: (page.rotate + this.rotation()) % 360
      });

      // Clear the loading indicator
      pageContainer.innerHTML = '';

      // 1. Setup Canvas
      const canvas = document.createElement('canvas');
      const pixelRatio = window.devicePixelRatio || 1;
      const scaledWidth = Math.floor(viewport.width * pixelRatio);
      const scaledHeight = Math.floor(viewport.height * pixelRatio);

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1';

      pageContainer.appendChild(canvas);

      // Page Number Indicator (Overlay)
      const pageIndicator = document.createElement('div');
      pageIndicator.className = 'page-number';
      pageIndicator.textContent = `${pageNumber}`;
      pageIndicator.style.position = 'absolute';
      pageIndicator.style.bottom = '5px';
      pageIndicator.style.right = '5px';
      pageIndicator.style.padding = '2px 6px';
      pageIndicator.style.background = 'rgba(0, 0, 0, 0.5)';
      pageIndicator.style.color = 'white';
      pageIndicator.style.borderRadius = '4px';
      pageIndicator.style.fontSize = '12px';
      pageIndicator.style.zIndex = '5';
      pageContainer.appendChild(pageIndicator);

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is unavailable');

      context.scale(pixelRatio, pixelRatio);

      // Render Page
      const renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport: viewport,
        annotationMode: this.options?.renderAnnotationLayer !== false && this.options?.renderForms !== false
          ? pdfjsLib.AnnotationMode.ENABLE_FORMS : pdfjsLib.AnnotationMode.ENABLE
      });

      this.renderTasks.add(renderTask);
      try { await renderTask.promise; } finally { this.renderTasks.delete(renderTask); }
      if (this.destroyed || version !== this.renderVersion) return;

      // 2. Setup Text Layer (if enabled)
      if (this.options?.enableTextSelection !== false && this.options?.renderTextLayer !== false) {
        const textContent = await page.getTextContent();
        if (this.destroyed || version !== this.renderVersion) return;
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';

        textLayerDiv.style.cssText = `
          width: ${viewport.rawDims.pageWidth * scale}px !important;
          height: ${viewport.rawDims.pageHeight * scale}px !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          overflow: hidden !important;
          line-height: 1.0 !important;
          z-index: 10 !important;
          pointer-events: auto !important;
          opacity: 1 !important;
          transform-origin: 0 0 !important;
        `;

        textLayerDiv.style.setProperty('--total-scale-factor', scale.toString());
        pageContainer.appendChild(textLayerDiv);

        try {
          const textTask = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport
          });
          // The layer uses unrotated dimensions; its own CSS applies page rotation.
          textLayerDiv.style.width = `${viewport.rawDims.pageWidth * scale}px`;
          textLayerDiv.style.height = `${viewport.rawDims.pageHeight * scale}px`;
          this.renderTasks.add(textTask);
          try { await textTask.render(); } finally { this.renderTasks.delete(textTask); }
          if (this.destroyed || version !== this.renderVersion) return;

          // Force styles to ensure selectability (fix for some CSS isolation issues)
          const textSpans = textLayerDiv.querySelectorAll('span');
          textSpans.forEach(span => {
            span.style.zIndex = '10';
            span.style.pointerEvents = 'auto';
            span.style.cursor = 'text';
          });

        } catch (e) {
          //console.error('Error rendering text layer:', e);
        }
      }

      if (this.searchText) {
        pageContainer.querySelectorAll('.textLayer span').forEach(span => {
          if (span.textContent?.toLowerCase().includes(this.searchText.toLowerCase())) span.classList.add('highlight');
        });
      }
      // 3. Setup Annotation Layer (if enabled)
      if (this.options?.renderAnnotationLayer !== false) {
        const annotationLayerDiv = document.createElement('div');
        annotationLayerDiv.className = 'annotationLayer';
        annotationLayerDiv.style.position = 'absolute';
        annotationLayerDiv.style.top = '0';
        annotationLayerDiv.style.left = '0';
        annotationLayerDiv.style.width = '100%';
        annotationLayerDiv.style.height = '100%';
        annotationLayerDiv.style.zIndex = '11';
        annotationLayerDiv.style.pointerEvents = 'none';
        pageContainer.appendChild(annotationLayerDiv);

        const annotations = await page.getAnnotations();
        if (this.destroyed || version !== this.renderVersion) return;

        if (this.options?.renderForms !== false) {
          const widgets = annotations.filter((annotation: any) => annotation.subtype === 'Widget' && !annotation.pushButton && annotation.fieldType !== 'Sig')
            .map((annotation: any) => ({ ...annotation, originalFieldName: annotation.fieldName, textContent: pdfDocument.annotationStorage.has(annotation.id) ? undefined : annotation.textContent, id: this.formIdPrefix + annotation.id, fieldName: this.formIdPrefix + annotation.fieldName }));
          if (widgets.length) {
            const storage = pdfDocument.annotationStorage;
            const prefix = this.formIdPrefix;
            // PDF.js needs globally unique DOM IDs/names; saved values must use the PDF's original IDs.
            const scopedStorage = new Proxy(storage, {
              get(target: any, key: string | symbol) {
                const value = target[key];
                if (['getValue', 'getRawValue', 'setValue', 'has', 'remove'].includes(String(key))) {
                  return (id: string, ...args: unknown[]) => value.call(target, id.startsWith(prefix) ? id.slice(prefix.length) : id, ...args);
                }
                return typeof value === 'function' ? value.bind(target) : value;
              }
            });
            let fields = this.fieldObjects.get(pdfDocument);
            if (!fields) {
              fields = pdfDocument.getFieldObjects() as Promise<Map<string, object[]> | null>;
              this.fieldObjects.set(pdfDocument, fields);
            }
            const originalFields = await fields;
            if (this.destroyed || version !== this.renderVersion) return;
            const scopedFields = originalFields ? new Map([...originalFields].map(([name, items]) => [prefix + name, items.map((item: any) => ({ ...item, id: prefix + item.id }))])) : undefined;
            const formLayer = document.createElement('div');
            formLayer.className = 'annotationLayer pdf-form-layer';
            const refreshPreviews = () => this.formRevision.update(value => value + 1);
            formLayer.addEventListener('input', refreshPreviews);
            formLayer.addEventListener('change', refreshPreviews);
            formLayer.style.setProperty('--total-scale-factor', String(scale));
            formLayer.style.setProperty('--scale-round-x', '1px');
            formLayer.style.setProperty('--scale-round-y', '1px');
            pageContainer.appendChild(formLayer);
            const formViewport = viewport.clone({ dontFlip: true });
            const layer = new pdfjsLib.AnnotationLayer({
              div: formLayer, page, viewport: formViewport,
              linkService: this.pdfService.getLinkService(), annotationStorage: scopedStorage,
              accessibilityManager: null, annotationCanvasMap: null, annotationEditorUIManager: null,
              structTreeLayer: null, commentManager: null
            });
            this.annotationLayers.add(layer);
            await layer.render({
              viewport: formViewport, div: formLayer, annotations: widgets, page,
              linkService: this.pdfService.getLinkService(), annotationStorage: scopedStorage,
              fieldObjects: scopedFields, renderForms: true, enableScripting: false
            });
            if (this.destroyed || version !== this.renderVersion) { layer.destroy(); return; }
            // Supply readable names even when the PDF omits an alternate field label.
            for (const widget of widgets) {
              formLayer.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-element-id="${CSS.escape(widget.id)}"]`).forEach(control => {
                if (!control.hasAttribute('aria-label')) control.setAttribute('aria-label', widget.alternativeText || widget.originalFieldName || 'PDF form field');
              });
            }
          }
        }

        if (annotations && annotations.length > 0) {
          annotations.forEach((annotation: any) => {
            if (annotation.subtype === 'Link') {
              const linkElement = document.createElement('a');
              const rect = pdfjsLib.Util.normalizeRect(annotation.rect);
              const start = viewport.convertToViewportPoint(rect[0], rect[1]);
              const end = viewport.convertToViewportPoint(rect[2], rect[3]);
              const bounds = pdfjsLib.Util.normalizeRect([...start, ...end]);

              linkElement.style.position = 'absolute';
              linkElement.style.left = `${bounds[0]}px`;
              linkElement.style.top = `${bounds[1]}px`;
              linkElement.style.width = `${bounds[2] - bounds[0]}px`;
              linkElement.style.height = `${bounds[3] - bounds[1]}px`;
              linkElement.style.border = '1px solid rgba(0, 0, 255, 0.1)';
              linkElement.style.cursor = 'pointer';
              linkElement.style.pointerEvents = 'auto';
              linkElement.rel = 'noopener noreferrer';

              if (annotation.url) {
                linkElement.href = annotation.url;
                linkElement.target = '_blank';
              } else if (annotation.dest) {
                linkElement.href = '#';
                linkElement.addEventListener('click', (e) => {
                  e.preventDefault();
                  void this.pdfService.getLinkService().navigateTo(annotation.dest).catch((error: unknown) => this.documentLoadError.emit(error));
                });
              }

              annotationLayerDiv.appendChild(linkElement);
            }
          });
        }
      }

    } catch (err) {
      if (this.destroyed || version !== this.renderVersion) return;
      pageContainer.classList.remove('rendered');
      pageContainer.textContent = `Failed to render page ${pageNumber}`;
      this.documentLoadError.emit(err);
    }
  }



  /**
   * Handle page change event from controls
   * @param pageNumber The new page number
   */
  onPageChange(pageNumber: number): void {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > this.totalPages()) return;
    this.pdfService.setCurrentPage(pageNumber);

    // Scroll to the selected page
    const container = this.canvasContainer.nativeElement;
    const pageElement = container.querySelector(`[data-page-number="${pageNumber}"]`);

    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Handle zoom change event from controls
   * @param zoom The new zoom level
   */
  onZoomChange(zoom: number): void {
    this.autoFit = false;
    this.pdfService.setZoom(zoom);
  }

  /**
   * Handle rotation change event from controls
   * @param rotation The rotation change in degrees
   */
  onRotationChange(rotation: number): void {
    this.pdfService.rotate(rotation);
  }

  /**
   * Handle download button click
   */
  onDownload(): void {
    void this.pdfService.downloadPdf().catch(error => this.documentLoadError.emit(error));
  }

  /**
   * Handle print button click
   */
  onPrint(): void {
    void this.pdfService.printPdf().catch(error => this.documentLoadError.emit(error));
  }

  /**
   * Handle search request
   * @param text The text to search for
   */
  async onSearch(text: string): Promise<void> {
    const version = ++this.searchVersion;
    this.searchText = text.trim();
    // Clear previous highlights
    this.clearSearchHighlights();
    if (!this.searchText) return;

    // Perform search
    const results = await this.pdfService.search(text);
    if (this.destroyed || version !== this.searchVersion) return;

    if (results.length === 0) {
      //console.log('No search results found');
      return;
    }

    // Navigate to the first result
    const firstResult = results[0];
    this.onPageChange(firstResult.pageNumber);

    // Highlight all results
    results.forEach(result => {
      const pageElement = this.canvasContainer.nativeElement.querySelector(
        `[data-page-number="${result.pageNumber}"]`
      );

      if (pageElement) {
        const textLayer = pageElement.querySelector('.textLayer');
        if (textLayer) {
          // Find the text span that contains the search text
          const textSpans = textLayer.querySelectorAll('span');
          textSpans.forEach(span => {
            if (span.textContent?.toLowerCase().includes(text.toLowerCase())) {
              span.classList.add('highlight');
            }
          });
        }
      }
    });
  }

  /**
   * Clear all search highlights
   */
  private clearSearchHighlights(): void {
    const highlights = this.canvasContainer.nativeElement.querySelectorAll('.textLayer .highlight');
    highlights.forEach(span => (span as HTMLElement).classList.remove('highlight'));
  }
}

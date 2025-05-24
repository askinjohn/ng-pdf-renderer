import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, lastValueFrom, takeUntil } from 'rxjs';

import { PdfService } from '../services/pdf.service';
import { PdfControlsComponent } from './pdf-controls.component';
import { PdfOptions } from '../models/pdf-options.model';

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';
// REMOVED: import 'pdfjs-dist/web/pdf_viewer.css'; - This is handled in the CSS file

/**
 * Main component for rendering PDFs
 * Uses modern Angular patterns including standalone components and signals
 */
@Component({
  selector: 'ng-pdf-viewer',
  standalone: true,  // Modern Angular standalone component (no NgModule needed)
  imports: [CommonModule, PdfControlsComponent],  // Import dependencies
  template: `
    <!-- Main container with configurable dimensions -->
    <div class="pdf-container" [style.width]="options?.width || '100%'" [style.height]="options?.height || '500px'">
      <!-- Controls bar - conditionally shown based on options -->
      <ng-pdf-controls 
        *ngIf="options?.showControls === true"
        [currentPage]="currentPage()"
        [totalPages]="totalPages()"
        [zoom]="zoom()"
        [rotation]="rotation()"
        [showNavigation]="options?.showNavigation !== false"
        [showZoomControls]="options?.showZoomControls !== false"
        [showRotationControls]="options?.showRotationControls !== false"
        [showDownloadButton]="options?.showDownloadButton !== false"
        [showPrintButton]="options?.showPrintButton !== false"
        [showSearchBar]="options?.showSearchBar !== false"
        [showThumbnails]="options?.showThumbnails !== false"
        [showOutline]="options?.showOutline !== false"
        (pageChange)="onPageChange($event)"
        (zoomChange)="onZoomChange($event)"
        (rotationChange)="onRotationChange($event)"
        (download)="onDownload()"
        (print)="onPrint()"
        (search)="onSearch($event)">
      </ng-pdf-controls>
      
      <!-- Main PDF viewing area -->
      <div class="pdf-viewer">
        <!-- Loading indicator -->
        <div class="pdf-loading" *ngIf="loading()">Loading...</div>
        <!-- Error message display -->
        <div class="pdf-error" *ngIf="error()">{{ error() }}</div>
        
        <!-- PDF content container with rotation transform -->
        <div class="pdf-content" [style.transform]="'rotate(' + rotation() + 'deg)'">
          <!-- Canvas where PDF will be rendered -->
          <div #canvasContainer></div>
        </div>
      </div>
      
      <!-- Optional thumbnails panel -->
      <div class="pdf-thumbnails" *ngIf="options?.showThumbnails">
        <!-- Thumbnails will be implemented here -->
      </div>
      
      <!-- Optional outline/bookmarks panel -->
      <div class="pdf-outline" *ngIf="options?.showOutline">
        <!-- Outline will be implemented here -->
      </div>
    </div>
  `,
  styles: [`
    /* Container styling */
    .pdf-container {
      display: flex;
      flex-direction: column;
      border: 1px solid #ddd;
      overflow: hidden;
      height: 100%;
    }
    
    /* PDF viewer area */
    .pdf-viewer {
      flex: 1;
      overflow: auto;
      position: relative;
      background-color: #f5f5f5;
    }
    
    /* Content container with transition for smooth rotation */
    .pdf-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.3s ease;
      width: 100%;
      padding: 20px 0;
    }
    
    /* Loading and error message styling */
    .pdf-loading, .pdf-error {
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
    ::ng-deep .pdf-page {
      position: relative;
      margin: 10px 0;
    }
    
    ::ng-deep .pdf-page canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
    
    /* Annotation layer styling */
    ::ng-deep .annotationLayer {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      z-index: 3;
    }
    
    ::ng-deep .annotationLayer section {
      position: absolute;
    }
    
    ::ng-deep .annotationLayer .linkAnnotation > a {
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
    
    ::ng-deep .annotationLayer .buttonWidgetAnnotation.pushButton > a {
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

    /* ENHANCED Text layer styling - CRITICAL for proper alignment and interaction */
    ::ng-deep .pdf-page .textLayer,
    ::ng-deep div.textLayer {
      position: absolute !important;
      text-align: initial !important;
      left: 0 !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      overflow: hidden !important;
      /* Production settings - text invisible but selectable */
      opacity: 0.25 !important;
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

    ::ng-deep .textLayer span,
    ::ng-deep .textLayer br {
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
    ::ng-deep .textLayer ::selection {
      background: rgba(0, 100, 255, 0.3) !important;
      color: rgba(0, 100, 255, 0.3) !important;
    }

    ::ng-deep .textLayer ::-moz-selection {
      background: rgba(0, 100, 255, 0.3) !important;
      color: rgba(0, 100, 255, 0.3) !important;
    }
    
    /* Additional selection fallbacks */
    ::ng-deep .textLayer span::selection {
      background: rgba(0, 100, 255, 0.3) !important;
    }
    
    ::ng-deep .textLayer span::-moz-selection {
      background: rgba(0, 100, 255, 0.3) !important;
    }

    /* Ensure text layer is properly sized */
    ::ng-deep .textLayer .endOfContent {
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

    ::ng-deep .textLayer .highlight {
      margin: -1px;
      padding: 1px;
      background-color: rgba(180, 0, 170, 0.4);
      border-radius: 4px;
    }

    ::ng-deep .textLayer .highlight.selected {
      background-color: rgba(0, 100, 0, 0.4);
    }
  `]
})
export class PdfViewerComponent implements OnInit, OnDestroy {
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
  private currentRenderTask: any = null;
  
  /**
   * Initialize the component
   */
  ngOnInit(): void {
    
    
    // Apply initial options if provided
    if (this.options?.initialZoom) {
     
      this.zoom.set(this.options.initialZoom);
      this.pdfService.setZoom(this.options.initialZoom);
    } else {
      // Default to a higher zoom level (2.0 = 200%) to better fit screens
      // This seems to work better on modern high-DPI displays
      this.zoom.set(2.0);
      this.pdfService.setZoom(2.0);
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
        
        this.zoom.set(zoom);
        // Re-render all pages when zoom changes
        if (this.pdfService.getCurrentDocument()) {
          this.renderAllPages();
        }
      });
      
    this.pdfService.rotation$.pipe(takeUntil(this.destroy$))
      .subscribe(rotation => {
        
        this.rotation.set(rotation);
        // Re-render all pages when rotation changes
        if (this.pdfService.getCurrentDocument()) {
          this.renderAllPages();
        }
      });
    
    // Load the document
    this.loadDocument();
  }
  
  /**
   * Clean up subscriptions on component destruction
   */
  ngOnDestroy(): void {
    // Cancel any pending render tasks
    if (this.currentRenderTask) {
      try {
        this.currentRenderTask.cancel();
      } catch (e) {
        //console.log('Error cancelling render task during destroy:', e);
      }
    }
    
    // Complete the destroy subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load the PDF document
   */
  private async loadDocument(): Promise<void> {
    if (!this.src) {
      this.error.set('No PDF source provided');
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    //console.log(`Loading PDF from source: ${typeof this.src === 'string' ? this.src : 'Binary data'}`);
    
    try {
      // Use service to load the document
      const pdfDocument = await this.pdfService.loadDocument(this.src);
      //console.log('PDF document loaded successfully!', pdfDocument);
      this.documentLoaded.emit(pdfDocument);
      
      // Set total pages
      this.totalPages.set(pdfDocument.numPages);
      //console.log(`Total pages: ${pdfDocument.numPages}`);
      
      // Set current page to 1 or initialPage
      const initialPage = this.options?.initialPage || 1;
      this.currentPage.set(initialPage);
      this.pdfService.setCurrentPage(initialPage);
      
      // Render all pages in continuous mode
      await this.renderAllPages();
    } catch (err: any) {
      //console.error('Error loading PDF:', err);
      this.error.set(err.message || 'Failed to load PDF');
      this.documentLoadError.emit(err);
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * Render a specific page of the PDF
   * @param pageNumber The page number to render
   */
  private async renderPage(pageNumber: number): Promise<void> {
    // Ensure there's a page number
    if (!pageNumber) {
      pageNumber = 1;
    }
    
    //console.log(`Attempting to render page ${pageNumber}`);
    
    // Cancel any ongoing render task
    if (this.currentRenderTask) {
      //console.log('Cancelling previous render task');
      try {
        await this.currentRenderTask.cancel();
      } catch (e) {
        //console.log('Error cancelling previous render task:', e);
      }
      this.currentRenderTask = null;
    }
    
    try {
      // Get the document directly from the service
      const pdfDocument = this.pdfService.getCurrentDocument();
      
      if (!pdfDocument) {
        //console.error('No PDF document available');
        return;
      }
      
      //console.log(`PDF document has ${pdfDocument.numPages} pages`);
      
      // Get the page from the document
      const page = await pdfDocument.getPage(pageNumber);
      //console.log('Page object retrieved:', page !== null);
      
      // Calculate scale to fit the canvas
      const scale = this.zoom();
      
      // Set up viewport based on current zoom and rotation
      const viewport = page.getViewport({ 
        scale: scale, 
        rotation: this.rotation() 
      });
      
      // Clear the canvas container
      const container = this.canvasContainer.nativeElement;
      container.innerHTML = '';
      
      // Create a new canvas element for this render operation
      const canvas = document.createElement('canvas');
      
      // Apply device pixel ratio for sharper rendering on high-DPI displays
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Scale canvas by pixel ratio for sharper rendering
      const scaledWidth = Math.floor(viewport.width * pixelRatio);
      const scaledHeight = Math.floor(viewport.height * pixelRatio);
      
      // Set canvas dimensions with pixel ratio factored in
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      // Set display size through CSS (original size)
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';
      
      container.appendChild(canvas);
      
      // Get the canvas context
      const context = canvas.getContext('2d');
      
      if (!context) {
        //console.error('Canvas rendering context not available');
        this.error.set('Canvas rendering context not available');
        return;
      }
      
      // Scale the context to account for the device pixel ratio
      context.scale(pixelRatio, pixelRatio);
      
      //console.log(`Rendering with viewport: ${viewport.width}x${viewport.height}, scale: ${scale}, pixel ratio: ${pixelRatio}`);
      
      // Render the page to the canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      //console.log('Starting page rendering...');
      // Store the render task for potential cancellation
      this.currentRenderTask = page.render(renderContext);
      
      // Wait for rendering to complete
      await this.currentRenderTask.promise;
      //console.log('Page rendered successfully');
      this.currentRenderTask = null;
    } catch (err: any) {
      // Check if this is a cancellation error, which is expected when navigating quickly
      if (err && err.name === 'RenderingCancelledException') {
        //console.log('Rendering was cancelled');
      } else {
        //console.error('Error rendering page:', err);
        this.error.set(err.message || 'Failed to render PDF page');
      }
    }
  }
  
  /**
   * Render all pages of the PDF in continuous mode
   */
  private async renderAllPages(): Promise<void> {
    // Get the document directly from the service
    const pdfDocument = this.pdfService.getCurrentDocument();
    
    if (!pdfDocument) {
      //console.error('No PDF document available');
      return;
    }
    
    // Auto-scale to fit the container width if needed
    try {
      if (this.options?.autoFit !== false) {
        const container = this.canvasContainer.nativeElement;
        //console.log('Container width:', container.clientWidth);
        const containerWidth = container.clientWidth || 800; // Fallback to 800 if clientWidth is 0
        const firstPage = await pdfDocument.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        const pageWidth = viewport.width;
        
        //console.log('Page width at scale 1.0:', pageWidth);
        //console.log('Container width:', containerWidth);
        
        // Calculate scale to fit container width (with some margin)
        const scaleFactor = Math.max((containerWidth - 40) / pageWidth, 1.5);
        
        //console.log('Calculated scale factor:', scaleFactor);
        
        // Only update if significantly different from current zoom
        if (Math.abs(scaleFactor - this.zoom()) > 0.05) {
          //console.log(`Auto-fitting: scaling to ${scaleFactor.toFixed(2)}`);
          this.zoom.set(scaleFactor);
          this.pdfService.setZoom(scaleFactor);
        }
      }
    } catch (err) {
      //console.error('Error in auto-scaling:', err);
      // Set a safe default zoom level if auto-scaling fails
      this.zoom.set(1.5);
      this.pdfService.setZoom(1.5);
    }
    
    const totalPages = pdfDocument.numPages;
    //console.log(`Rendering all ${totalPages} pages`);
    
    // Clear the canvas container
    const container = this.canvasContainer.nativeElement;
    container.innerHTML = '';
    
    // Calculate scale based on zoom
    const scale = this.zoom();
    
    // Render each page
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      try {
        // Get the page
        const page = await pdfDocument.getPage(pageNumber);
        
        // Create viewport with current zoom and rotation
        const viewport = page.getViewport({ 
          scale: scale, 
          rotation: this.rotation() 
        });
        
        // Create page container with margin
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.style.margin = '10px 0';
        pageContainer.style.position = 'relative';
        pageContainer.style.overflow = 'hidden'; // Prevent overflow issues
        pageContainer.style.backgroundColor = '#fff'; // Add white background
        pageContainer.style.width = Math.floor(viewport.width) + 'px';
        pageContainer.style.height = Math.floor(viewport.height) + 'px';
        pageContainer.setAttribute('data-page-number', pageNumber.toString());
        
        // Create canvas for this page
        const canvas = document.createElement('canvas');
        
        // Apply device pixel ratio for sharper rendering on high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Scale canvas by pixel ratio for sharper rendering
        const scaledWidth = Math.floor(viewport.width * pixelRatio);
        const scaledHeight = Math.floor(viewport.height * pixelRatio);
        
        // Set canvas dimensions with pixel ratio factored in
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        
        // Set display size through CSS (original size)
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';
        
        pageContainer.appendChild(canvas);
        
        // Add page number indicator
        const pageIndicator = document.createElement('div');
        pageIndicator.className = 'page-number';
        pageIndicator.textContent = `Page ${pageNumber} of ${totalPages}`;
        pageIndicator.style.position = 'absolute';
        pageIndicator.style.bottom = '5px';
        pageIndicator.style.right = '5px';
        pageIndicator.style.padding = '2px 5px';
        pageIndicator.style.background = 'rgba(255, 255, 255, 0.7)';
        pageIndicator.style.borderRadius = '3px';
        pageIndicator.style.fontSize = '12px';
        pageContainer.appendChild(pageIndicator);
        
        // Add the page container to the main container
        container.appendChild(pageContainer);
        
        // Get the canvas context
        const context = canvas.getContext('2d');
        
        if (!context) {
          //console.error(`Canvas context not available for page ${pageNumber}`);
          continue;
        }
        
        // Scale the context to account for the device pixel ratio
        context.scale(pixelRatio, pixelRatio);
        
        // Render the page to the canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        //console.log(`Rendering page ${pageNumber}...`);
        const renderTask = page.render(renderContext);
        await renderTask.promise;
        //console.log(`Page ${pageNumber} rendered successfully`);

          // ENHANCED TEXT LAYER RENDERING - Key Fix!
          if (this.options?.enableTextSelection !== false) {
            //console.log(`Adding text layer for page ${pageNumber}...`);
            
            const textContent = await page.getTextContent();
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'textLayer';
            
            // CRITICAL: Proper sizing and positioning with maximum override
            textLayerDiv.style.cssText = `
              width: ${viewport.width}px !important;
              height: ${viewport.height}px !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              overflow: hidden !important;
              line-height: 1.0 !important;
              z-index: 10 !important;
              pointer-events: auto !important;
              opacity: 0.25 !important;
              transform-origin: 0 0 !important;
            `;
            
            // CRITICAL: Set the scale factor CSS variable for proper text alignment
            textLayerDiv.style.setProperty('--scale-factor', scale.toString());
            
            //console.log(`Text layer scale factor set to: ${scale}`);
            //console.log(`Text layer z-index set to: 10`);
            
            pageContainer.appendChild(textLayerDiv);

            try {
              // Enhanced text layer rendering with better error handling
              const textLayerRender = pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport: viewport,
                textDivs: [],
                // Additional options for better rendering
                textDivProperties: new WeakMap(),
                isOffscreenCanvasSupported: false
              });
              
              await textLayerRender.promise;
              //console.log(`Text layer rendered successfully for page ${pageNumber}`);
              
              // Verify text layer content
              const textSpans = textLayerDiv.querySelectorAll('span');
              //console.log(`Text layer contains ${textSpans.length} text spans`);
              
              // Add debugging info to each span and ensure proper z-index
              textSpans.forEach((span, index) => {
                const textContent = span.textContent || '';
                if (textContent.trim()) {
                  span.setAttribute('data-debug', `span-${index}: "${textContent.substring(0, 20)}"`);
                  
                  // FORCE z-index on each span
                  span.style.cssText += `
                    z-index: 10 !important;
                    pointer-events: auto !important;
                    cursor: text !important;
                  `;
                  
                  // Add selection event listeners for debugging
                  span.addEventListener('mousedown', (e) => {
                    //console.log('Text selection started on:', textContent.substring(0, 20));
                    //console.log('Span z-index:', window.getComputedStyle(span).zIndex);
                    //console.log('Span pointer-events:', window.getComputedStyle(span).pointerEvents);
                  });
                  
                  span.addEventListener('selectstart', () => {
                    //console.log('Select start event on:', textContent.substring(0, 20));
                  });
                  
                  span.addEventListener('click', () => {
                    //console.log('Text span clicked:', textContent.substring(0, 20));
                  });
                }
              });
              
              // Debug: Log the computed styles
              //console.log('Text layer computed z-index:', window.getComputedStyle(textLayerDiv).zIndex);
              //console.log('Text layer computed pointer-events:', window.getComputedStyle(textLayerDiv).pointerEvents);
              
            } catch (textError) {
              //console.error(`Error rendering text layer for page ${pageNumber}:`, textError);
            }
            
            // Additional debugging: Force z-index after rendering
            setTimeout(() => {
              const finalZIndex = window.getComputedStyle(textLayerDiv).zIndex;
              //console.log(`Final text layer z-index for page ${pageNumber}:`, finalZIndex);
              
              if (finalZIndex !== '10') {
                //console.warn('Z-index override failed, forcing via JavaScript');
                textLayerDiv.style.zIndex = '10';
                textLayerDiv.style.setProperty('z-index', '10', 'important');
              }
            }, 100);
          }
        
        // Add annotation layer if enabled (default is true)
        if (this.options?.renderAnnotationLayer !== false) {
          // Create annotation layer div
          const annotationLayerDiv = document.createElement('div');
          annotationLayerDiv.className = 'annotationLayer';
          annotationLayerDiv.style.position = 'absolute';
          annotationLayerDiv.style.top = '0';
          annotationLayerDiv.style.left = '0';
          annotationLayerDiv.style.width = '100%';
          annotationLayerDiv.style.height = '100%';
          annotationLayerDiv.style.zIndex = '3'; // Ensure it's on top
          annotationLayerDiv.style.pointerEvents = 'auto';
          pageContainer.appendChild(annotationLayerDiv);
          
          // Get annotations from page
          const annotations = await page.getAnnotations();
          
          if (annotations && annotations.length > 0) {
            // Process annotation items (focusing on links)
            annotations.forEach((annotation: any) => {
              if (annotation.subtype === 'Link') { // Handle link annotations
                const linkElement = document.createElement('a');
                
                // Position the link
                const rect = pdfjsLib.Util.normalizeRect([
                  annotation.rect[0], 
                  annotation.rect[1], 
                  annotation.rect[2], 
                  annotation.rect[3]
                ]);
                
                const bounds = pdfjsLib.Util.getAxialAlignedBoundingBox(
                  rect,
                  viewport.transform
                );
                
                linkElement.style.position = 'absolute';
                linkElement.style.left = `${bounds[0]}px`;
                linkElement.style.top = `${bounds[1]}px`;
                linkElement.style.width = `${bounds[2] - bounds[0]}px`;
                linkElement.style.height = `${bounds[3] - bounds[1]}px`;
                linkElement.style.border = '1px solid rgba(0, 0, 255, 0.1)';
                linkElement.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
                linkElement.style.borderRadius = '2px';
                linkElement.style.zIndex = '3';
                linkElement.style.cursor = 'pointer';
                
                // Handle URL links
                if (annotation.url) {
                  linkElement.href = annotation.url;
                  linkElement.target = '_blank';
                } 
                // Handle internal page links
                else if (annotation.dest) {
                  linkElement.href = '#';
                  linkElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Navigate to page destination using the service
                    this.pdfService.getLinkService().navigateTo(annotation.dest);
                  });
                }
                
                // Add the link to the annotations layer
                const linkContainer = document.createElement('div');
                linkContainer.className = 'linkAnnotation';
                linkContainer.appendChild(linkElement);
                annotationLayerDiv.appendChild(linkContainer);
              }
            });
          }
        }
        
        // Add intersection observer to detect when page is visible
        this.observePageVisibility(pageContainer, pageNumber);
      } catch (err: any) {
        //console.error(`Error rendering page ${pageNumber}:`, err);
      }
    }
  }
  
  /**
   * Observe page visibility to update current page number
   */
  private observePageVisibility(pageElement: HTMLElement, pageNumber: number): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          // Update current page without triggering re-render
          if (this.currentPage() !== pageNumber) {
            this.currentPage.set(pageNumber);
            this.pageChange.emit(pageNumber);
          }
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(pageElement);
  }
  
  /**
   * Handle page change event from controls
   * @param pageNumber The new page number
   */
  onPageChange(pageNumber: number): void {
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
    this.pdfService.downloadPdf();
  }
  
  /**
   * Handle print button click
   */
  onPrint(): void {
    this.pdfService.printPdf();
  }
  
  /**
   * Handle search request
   * @param text The text to search for
   */
  async onSearch(text: string): Promise<void> {
    if (!text.trim()) {
      return;
    }

    // Clear previous highlights
    this.clearSearchHighlights();

    // Perform search
    const results = await this.pdfService.search(text);
    
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

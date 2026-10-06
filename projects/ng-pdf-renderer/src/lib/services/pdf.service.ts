import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
// Import PDF.js library
import * as pdfjsLib from 'pdfjs-dist';

import { PdfPasswordRequest } from '../models/pdf-options.model';
import { NgPdfRendererConfigService } from '../ng-pdf-renderer.config';

/**
 * Service handling PDF operations using PDF.js
 * Provides methods to load, navigate, and manipulate PDF documents
 */
@Injectable({
  providedIn: 'root'
})
export class PdfService implements OnDestroy {
  private loadingTask: any = null;
  private loadVersion = 0;
  private passwordCallback: ((password: string) => void) | null = null;
  private passwordRequestSubject = new BehaviorSubject<PdfPasswordRequest | null>(null);
  passwordRequest$ = this.passwordRequestSubject.asObservable();

  submitPassword(password: string): void {
    const callback = this.passwordCallback;
    if (!callback) return;
    this.passwordCallback = null;
    this.passwordRequestSubject.next(null);
    callback(password);
  }

  private resetPasswordRequest(): void {
    this.passwordCallback = null;
    this.passwordRequestSubject.next(null);
  }

  /** Serialize edited AcroForm fields, or return the original bytes for an unedited PDF. */
  async getDocumentData(): Promise<Uint8Array<ArrayBuffer> | null> {
    const document = this.getCurrentDocument();
    if (!document) return null;
    const data = await (document.annotationStorage?.size ? document.saveDocument() : document.getData());
    return new Uint8Array(data);
  }
  // BehaviorSubjects to track PDF state (these emit current value on subscription)
  private pdfDocumentSubject = new BehaviorSubject<any>(null);  // Holds the PDF document object
  pdfDocument$ = this.pdfDocumentSubject.asObservable();        // Observable for components to subscribe to
  
  private currentPageSubject = new BehaviorSubject<number>(1);  // Current page being viewed
  currentPage$ = this.currentPageSubject.asObservable();
  
  private totalPagesSubject = new BehaviorSubject<number>(0);   // Total number of pages in the document
  totalPages$ = this.totalPagesSubject.asObservable();
  
  private zoomSubject = new BehaviorSubject<number>(1);         // Current zoom level (1 = 100%)
  zoom$ = this.zoomSubject.asObservable();
  
  private rotationSubject = new BehaviorSubject<number>(0);     // Current rotation in degrees
  rotation$ = this.rotationSubject.asObservable();

  // Link service for annotations (especially hyperlinks)
  private linkService: any;
  
  // Properties needed for link service
  private _pdfDocument: any = null;
  private _viewer: any = null;

  // Inject the configuration service
  private configService = inject(NgPdfRendererConfigService);

  constructor() {
    // Automatically configure the worker source
    this.configureWorkerSource();
    
    // Initialize link service
    this.linkService = {
      setDocument: (pdfDocument: any) => {
        this._pdfDocument = pdfDocument;
      },
      setViewer: (viewer: any) => {
        this._viewer = viewer;
      },
      navigateTo: async (dest: any) => {
        const document = this._pdfDocument;
        if (!document) return;
        const destination = typeof dest === 'string' ? await document.getDestination(dest) : dest;
        if (!Array.isArray(destination)) return;
        const ref = destination[0];
        const index = typeof ref === 'number' ? ref : await document.getPageIndex(ref);
        if (document !== this._pdfDocument) return;
        this.setCurrentPage(index + 1);
        this._viewer?.scrollPageIntoView({ pageNumber: index + 1 });
      },
      getDestinationHash: (dest: any) => {
        return `page=${dest}`;
      },
      getAnchorUrl: (hash: string) => {
        return `#${hash}`;
      }
    };
  }
  
  /**
   * Gets the link service for handling annotations
   * @returns The link service instance
   */
  getLinkService(): any {
    return this.linkService;
  }

  /**
   * Get the current PDF document
   * @returns The current PDF document or null if none is loaded
   */
  getCurrentDocument(): any {
    return this.pdfDocumentSubject.value;
  }

  /**
   * Configures the PDF.js worker source automatically
   * This eliminates the need for users to manually copy worker files
   */
  private configureWorkerSource(): void {
    if (this.configService.config.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = this.configService.config.workerSrc;
      return;
    }
    if (pdfjsLib.GlobalWorkerOptions.workerSrc) return;

    // Get the current PDF.js version
    const pdfVersion = pdfjsLib.version;
    
    // Detect major version to determine worker file name
    const majorVersion = parseInt(pdfVersion.split('.')[0]);
    
    // PDF.js v4+ uses .mjs files, v3 and below use .min.js
    const workerFile = majorVersion >= 4 ? 'pdf.worker.mjs' : 'pdf.worker.min.js';
    
    // CDN path to the worker file (using unpkg CDN)
    const cdnWorkerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/${workerFile}`;
    
    //console.log(`PDF.js version ${pdfVersion} detected (v${majorVersion})`);    
    //console.log(`Using PDF.js worker from CDN: ${cdnWorkerSrc}`);
    pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorkerSrc;
  }

  /**
   * Loads a PDF document from a URL or binary data
   * @param src URL or binary data of the PDF
   * @returns Promise resolving to the loaded PDF document
   */
  async loadDocument(src: string | Uint8Array): Promise<any> {
    const version = ++this.loadVersion;
    this.resetPasswordRequest();
    const previousTask = this.loadingTask;
    this.loadingTask = null;
    this.pdfDocumentSubject.next(null);
    this.totalPagesSubject.next(0);
    this.currentPageSubject.next(1);
    this.linkService.setDocument(null);
    await previousTask?.destroy();
    if (version !== this.loadVersion) throw new Error('PDF loading cancelled');
    this.configureWorkerSource();
    const task = pdfjsLib.getDocument({
      ...(typeof src === 'string' ? { url: src } : { data: src.slice() })
    });
    this.loadingTask = task;
    task.onPassword = (updatePassword: (password: string) => void, reason: number) => {
      if (version !== this.loadVersion) return;
      this.passwordCallback = updatePassword;
      this.passwordRequestSubject.next({ incorrect: reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD });
    };
    const pdfDocument = await task.promise;
    if (version !== this.loadVersion) throw new Error('PDF loading cancelled');
    this.resetPasswordRequest();
    this.pdfDocumentSubject.next(pdfDocument);
    this.totalPagesSubject.next(pdfDocument.numPages);
    this.linkService.setDocument(pdfDocument);
    return pdfDocument;
  }

  async clearDocument(): Promise<void> {
    ++this.loadVersion;
    this.resetPasswordRequest();
    const task = this.loadingTask;
    this.loadingTask = null;
    this.pdfDocumentSubject.next(null);
    this.totalPagesSubject.next(0);
    this.currentPageSubject.next(1);
    this.linkService.setDocument(null);
    await task?.destroy();
  }

  ngOnDestroy(): void {
    ++this.loadVersion;
    this.resetPasswordRequest();
    void this.loadingTask?.destroy();
    this.loadingTask = null;
    this.linkService.setDocument(null);
    this.pdfDocumentSubject.next(null);
    this.pdfDocumentSubject.complete();
    this.currentPageSubject.complete();
    this.totalPagesSubject.complete();
    this.zoomSubject.complete();
    this.rotationSubject.complete();
    this.passwordRequestSubject.complete();
  }

  /**
   * Sets the current page to display
   * @param pageNumber The page number to display (1-based index)
   */
  setCurrentPage(pageNumber: number): void {
    const totalPages = this.totalPagesSubject.value;
    // Ensure page number is within valid range
    if (Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== this.currentPageSubject.value) {
      this.currentPageSubject.next(pageNumber);
    }
  }

  /**
   * Navigate to the next page if available
   */
  nextPage(): void {
    const currentPage = this.currentPageSubject.value;
    const totalPages = this.totalPagesSubject.value;
    if (currentPage < totalPages) {
      this.currentPageSubject.next(currentPage + 1);
    }
  }

  /**
   * Navigate to the previous page if available
   */
  previousPage(): void {
    const currentPage = this.currentPageSubject.value;
    if (currentPage > 1) {
      this.currentPageSubject.next(currentPage - 1);
    }
  }

  /**
   * Set the zoom level for the PDF
   * @param zoom The zoom level (1 = 100%)
   */
  setZoom(zoom: number): void {
    if (Number.isFinite(zoom) && zoom > 0) this.zoomSubject.next(Math.max(0.1, Math.min(zoom, 5)));
  }

  /**
   * Increase zoom by 20%
   */
  zoomIn(): void {
    const currentZoom = this.zoomSubject.value;
    this.setZoom(currentZoom * 1.2);
  }

  /**
   * Decrease zoom by 20%
   */
  zoomOut(): void {
    const currentZoom = this.zoomSubject.value;
    this.setZoom(currentZoom / 1.2);
  }

  /**
   * Rotate the PDF by a specified number of degrees
   * @param degrees The degrees to rotate (positive = clockwise, negative = counterclockwise)
   */
  rotate(degrees: number): void {
    if (!Number.isFinite(degrees) || degrees % 90 !== 0) return;
    const currentRotation = this.rotationSubject.value;
    // Calculate new rotation and keep it within 0-359 degrees
    let newRotation = (currentRotation + degrees) % 360;
    if (newRotation < 0) {
      newRotation += 360;
    }
    this.rotationSubject.next(newRotation);
  }

  /**
   * Get the document outline (bookmarks)
   * @returns Promise resolving to the outline structure or empty array
   */
  getOutline(): Promise<any[]> {
    const pdfDocument = this.pdfDocumentSubject.value;
    if (!pdfDocument) {
      return Promise.resolve([]);
    }
    // Get outline or return empty array if not available
    return pdfDocument.getOutline().then((outline: any[] | null) => outline ?? []);
  }

  /**
   * Generate a thumbnail for a specific page
   * @param pageNumber The page number to generate thumbnail for
   * @param scale The scale for the thumbnail (smaller = faster)
   * @returns Promise resolving to data URL of the thumbnail
   */
  async generateThumbnail(pageNumber: number, scale: number = 0.2): Promise<string> {
    const pdfDocument = this.pdfDocumentSubject.value;
    if (!pdfDocument) {
      return '';
    }

    try {
      // Get the page object from PDF document
      const page = await pdfDocument.getPage(pageNumber);
      // Create a viewport with the specified scale (smaller for thumbnails)
      const viewport = page.getViewport({ scale });
      
      // Create an off-screen canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render the page to the canvas
      await page.render({
        canvas,
        canvasContext: context,
        viewport
      }).promise;
      
      // Convert canvas to data URL
      return canvas.toDataURL();
    } catch (error) {
      //console.error('Error generating thumbnail:', error);
      return '';
    }
  }

  /**
   * Search for text in the PDF document
   * @param text The text to search for
   * @returns Promise resolving to an array of search results
   */
  async search(text: string): Promise<any[]> {
    const pdfDocument = this.pdfDocumentSubject.value;
    if (!pdfDocument) {
      //console.warn('No PDF document loaded');
      return [];
    }

    if (!text.trim()) return [];
    const results: any[] = [];
    const totalPages = pdfDocument.numPages;

    // Search through each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const textItems = textContent.items;

        // Search through text items on the page
        for (let i = 0; i < textItems.length; i++) {
          const item = textItems[i];
          if (typeof item.str === 'string' && item.str.toLowerCase().includes(text.toLowerCase())) {
            results.push({
              pageNumber: pageNum,
              text: item.str,
              transform: item.transform,
              width: item.width,
              height: item.height
            });
          }
        }
      } catch (error) {
        //console.error(`Error searching page ${pageNum}:`, error);
      }
    }

    return results;
  }

  /**
   * Download the PDF document
   */
  async downloadPdf(): Promise<void> {
    const pdfDocument = this.pdfDocumentSubject.value;
    if (!pdfDocument) {
      return;
    }
    
    try {
      // Get the binary data of the PDF
      const url = await this.getDocumentData();
      
      if (url) {
        // Create a blob from binary data
        const blob = new Blob([url], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Try to get filename from PDF metadata or use default
        let filename = 'document.pdf';
        try {
          const metadata = await pdfDocument.getMetadata();
          if (metadata.info && metadata.info.Title) {
            filename = `${metadata.info.Title}.pdf`;
          }
        } catch (error) {
          //console.error('Error getting PDF metadata:', error);
        }
        
        // Set download attribute and click the link
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up DOM and revoke blob URL
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
      } else {
        //console.error('Unable to download: PDF data not available');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Print the PDF document
   */
  async printPdf(): Promise<void> {
    const pdfDocument = this.pdfDocumentSubject.value;
    if (!pdfDocument) {
      return;
    }
    
    // Obtain data before inserting DOM resources so loading failures cannot leak iframes.
    const data = await this.getDocumentData();
    if (!data) return;
    const blobUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const iframe = document.createElement('iframe');
    iframe.title = 'PDF print preview';
    iframe.style.cssText = 'position:fixed;left:-10000px;width:1px;height:1px';
    const cleanup = () => {
      clearTimeout(timeout);
      iframe.remove();
      URL.revokeObjectURL(blobUrl);
    };
    const timeout = setTimeout(cleanup, 60000);
    iframe.onerror = cleanup;
    iframe.onload = () => {
      try {
        const target = iframe.contentWindow;
        if (!target) { cleanup(); return; }
        target.addEventListener('afterprint', cleanup, { once: true });
        target.focus();
        target.print();
      } catch {
        window.open(blobUrl, '_blank', 'noopener');
      }
    };
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
  }
}

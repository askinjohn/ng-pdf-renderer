import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// Import PDF.js library
import * as pdfjsLib from 'pdfjs-dist';

import { NgPdfRendererConfigService } from '../ng-pdf-renderer.config';

/**
 * Service handling PDF operations using PDF.js
 * Provides methods to load, navigate, and manipulate PDF documents
 */
@Injectable({
  providedIn: 'root'
})
export class PdfService {
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
      navigateTo: (dest: any) => {
        //console.log('Navigate to:', dest);
        if (dest && typeof dest === 'object' && dest.length > 0) {
          if (dest[0] && typeof dest[0] === 'object' && 'num' in dest[0]) {
            // Navigate to page
            const pageNumber = dest[0].num + 1;
            this.setCurrentPage(pageNumber);
            if (this._viewer && this._viewer.scrollPageIntoView) {
              this._viewer.scrollPageIntoView({ pageNumber });
            }
          }
        }
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
    // First, check if workerSrc is already set
    if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
      //console.log('Worker already set:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      return;
    }
    
    // If workerSrc is provided in the config, use it
    if (this.configService.config.workerSrc) {
      //console.log(`Setting worker from config: ${this.configService.config.workerSrc}`);
      pdfjsLib.GlobalWorkerOptions.workerSrc = this.configService.config.workerSrc;
      return;
    }

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
    try {
      //console.log('PDF.js worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc || 'NOT SET');
      //console.log(`Loading document from: ${typeof src === 'string' ? src : 'Binary data'}`);
      
      // Create a PDF loading task
      const loadingTask = pdfjsLib.getDocument(src);
      
      // Add progress tracking
      loadingTask.onProgress = (progressData: { loaded: number, total: number }) => {
        const progress = (progressData.loaded / progressData.total) * 100;
        //console.log(`Loading PDF: ${progress.toFixed(2)}%`);
      };
      
      // Wait for the document to load
      //console.log('Waiting for PDF document to load...');
      const pdfDocument = await loadingTask.promise;
      //console.log(`PDF document loaded with ${pdfDocument.numPages} pages`);
      
      // Update subjects with the loaded document info
      this.pdfDocumentSubject.next(pdfDocument);
      this.totalPagesSubject.next(pdfDocument.numPages);
      this.currentPageSubject.next(1);  // Reset to first page
      
      // Configure link service with the document
      this.linkService.setDocument(pdfDocument);
      this.linkService.setViewer({
        scrollPageIntoView: ({ pageNumber }: { pageNumber: number }) => {
          this.setCurrentPage(pageNumber);
        }
      });
      
      return pdfDocument;
    } catch (error) {
      //console.error('Error loading PDF document:', error);
      throw error; // Re-throw to allow component to handle it
    }
  }

  /**
   * Sets the current page to display
   * @param pageNumber The page number to display (1-based index)
   */
  setCurrentPage(pageNumber: number): void {
    const totalPages = this.totalPagesSubject.value;
    // Ensure page number is within valid range
    if (pageNumber >= 1 && pageNumber <= totalPages) {
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
    this.zoomSubject.next(zoom);
  }

  /**
   * Increase zoom by 20%
   */
  zoomIn(): void {
    const currentZoom = this.zoomSubject.value;
    this.zoomSubject.next(currentZoom * 1.2);
  }

  /**
   * Decrease zoom by 20%
   */
  zoomOut(): void {
    const currentZoom = this.zoomSubject.value;
    this.zoomSubject.next(currentZoom / 1.2);
  }

  /**
   * Rotate the PDF by a specified number of degrees
   * @param degrees The degrees to rotate (positive = clockwise, negative = counterclockwise)
   */
  rotate(degrees: number): void {
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
    return pdfDocument.getOutline() || Promise.resolve([]);
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
          if (item.str.toLowerCase().includes(text.toLowerCase())) {
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
      const url = pdfDocument.getData ? await pdfDocument.getData() : null;
      
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
        URL.revokeObjectURL(blobUrl);
      } else {
        //console.error('Unable to download: PDF data not available');
      }
    } catch (error) {
      //console.error('Error downloading PDF:', error);
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
    
    try {
      // Create hidden iframe to load PDF for printing
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'absolute';
      printIframe.style.top = '-1000px';
      printIframe.style.left = '-1000px';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      document.body.appendChild(printIframe);
      
      // Get PDF data and create a blob URL
      const data = await pdfDocument.getData();
      const blob = new Blob([data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Load PDF into iframe
      printIframe.src = blobUrl;
      
      // Once iframe is loaded, trigger print dialog
      printIframe.onload = () => {
        try {
          if (printIframe.contentWindow) {
            // Focus and print the iframe content
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
          }
        } catch (error) {
          //console.error('Error printing PDF:', error);
          
          // Fallback: open in new tab for user to print
          window.open(blobUrl, '_blank');
        } finally {
          // Clean up resources (after delay to allow for printing)
          setTimeout(() => {
            document.body.removeChild(printIframe);
            URL.revokeObjectURL(blobUrl);
          }, 1000);
        }
      };
    } catch (error) {
      //console.error('Error setting up PDF print:', error);
    }
  }
}
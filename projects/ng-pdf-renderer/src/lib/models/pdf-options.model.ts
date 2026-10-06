/**
 * Interface defining configuration options for the PDF viewer
 */
export interface PdfOptions {
  // Basic display options
  height?: string;             // Height of the PDF viewer container (e.g., '600px', '100%')
  width?: string;              // Width of the PDF viewer container (e.g., '100%', '800px')
  
  // Rendering options
  renderForms?: boolean;         // Enable interactive AcroForm widgets (default: true)
  renderTextLayer?: boolean;     // Whether to render the text layer (enables text selection and search)
  renderAnnotationLayer?: boolean; // Whether to render link annotations and AcroForm widgets
  
  // View options
  initialZoom?: number;        // Initial zoom level (e.g., 1 = 100%, 1.5 = 150%)
  initialPage?: number;        // The page number to display initially (starts at 1)
  autoFit?: boolean;           // Whether to automatically scale the PDF to fit the container width (default: true)
  
  // UI controls visibility
  showControls?: boolean;      // Whether to show the control bar (default: false)
  showNavigation?: boolean;    // Whether to show page navigation controls
  showZoomControls?: boolean;  // Whether to show zoom controls
  showRotationControls?: boolean; // Whether to show rotation controls
  showDownloadButton?: boolean; // Whether to show the download button
  showPrintButton?: boolean;   // Whether to show the print button
  showSearchBar?: boolean;     // Whether to show the search functionality
  showThumbnails?: boolean;    // Show a panel with lazy page thumbnails
  showOutline?: boolean;       // Show document bookmarks with nested navigation
  enableTextSelection?: boolean; // Whether to allow text selection in the document

  // Advanced options (automatically configured, only set if you need to override)
  workerSrc?: string;          // Path to a matching pdf.worker.mjs file (automatically detected or uses CDN)
}

export interface PdfOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  url?: string | null;
  items: PdfOutlineItem[];
}

export interface PdfPasswordRequest {
  incorrect: boolean;
}

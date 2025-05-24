/**
 * Interface defining configuration options for the PDF viewer
 */
export interface PdfOptions {
  // Basic display options
  height?: string;             // Height of the PDF viewer container (e.g., '600px', '100%')
  width?: string;              // Width of the PDF viewer container (e.g., '100%', '800px')
  
  // Rendering options
  renderTextLayer?: boolean;     // Whether to render the text layer (enables text selection and search)
  renderAnnotationLayer?: boolean; // Whether to render annotations (comments, form fields, etc.)
  
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
  showThumbnails?: boolean;    // Whether to show page thumbnails
  showOutline?: boolean;       // Whether to show document outline/bookmarks
  enableTextSelection?: boolean; // Whether to allow text selection in the document

  // Advanced options (automatically configured, only set if you need to override)
  workerSrc?: string;          // Path to pdf.worker.js file (automatically detected or uses CDN)
}
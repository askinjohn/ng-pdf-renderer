# ng-pdf-renderer 📄

A modern, zero-configuration PDF viewer for Angular applications with intelligent auto-fit, text selection, and responsive design.

[![npm version](https://badge.fury.io/js/ng-pdf-renderer.svg)](https://badge.fury.io/js/ng-pdf-renderer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-19+-red.svg)](https://angular.io/)

## ✨ Features

- 🚀 **Zero Configuration** - Works out of the box with sensible defaults
- 📱 **Responsive Design** - Auto-fits to any container size
- 📝 **Text Selection** - Copy text directly from PDFs
- 🔍 **Search Functionality** - Find text within documents
- 🖨️ **Print & Download** - Built-in actions
- 🔄 **Zoom & Rotation** - Interactive controls
- 📄 **Continuous Scrolling** - All pages rendered seamlessly
- 🎯 **Modern Angular** - Standalone components, signals, Angular 19+
- 🛠️ **Auto PDF.js Setup** - No manual worker configuration needed

## 📦 Installation

```bash
npm install ng-pdf-renderer
```

## 🚀 Quick Start

### Basic Usage (Recommended)

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

@Component({
  selector: 'app-pdf-demo',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <ng-pdf-viewer [src]=\"pdfUrl\"></ng-pdf-viewer>
  `
})
export class PdfDemoComponent {
  pdfUrl = '/assets/document.pdf';
}
```

That's it! The PDF viewer will automatically:
- Fit the PDF to your container width
- Enable text selection
- Handle high-DPI displays
- Set up PDF.js worker automatically

## ⚙️ Configuration Options

### Default Values (Applied Automatically)

```typescript
interface PdfOptions {
  // Display Options
  height?: string;                    // Default: '500px'
  width?: string;                     // Default: '100%'
  
  // Auto-Fit Behavior  
  autoFit?: boolean;                  // Default: true
  initialZoom?: number;               // Default: 1.0 (100%)
  initialPage?: number;               // Default: 1
  
  // Text & Interaction
  enableTextSelection?: boolean;      // Default: true
  renderTextLayer?: boolean;          // Default: true
  renderAnnotationLayer?: boolean;    // Default: true
  
  // Controls Visibility
  showControls?: boolean;             // Default: false (hidden)
  showNavigation?: boolean;           // Default: true
  showZoomControls?: boolean;         // Default: true
  showRotationControls?: boolean;     // Default: true
  showDownloadButton?: boolean;       // Default: true
  showPrintButton?: boolean;          // Default: true
  showSearchBar?: boolean;            // Default: true
  showThumbnails?: boolean;           // Default: false
  showOutline?: boolean;              // Default: false
}
```

### Custom Configuration Example

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent, PdfOptions } from 'ng-pdf-renderer';

@Component({
  selector: 'app-custom-pdf',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <ng-pdf-viewer 
      [src]=\"pdfUrl\" 
      [options]=\"pdfOptions\"
      (pageChange)=\"onPageChange($event)\"
      (documentLoaded)=\"onDocumentLoaded($event)\">
    </ng-pdf-viewer>
  `
})
export class CustomPdfComponent {
  pdfUrl = '/assets/document.pdf';
  
  pdfOptions: PdfOptions = {
    height: '800px',
    showControls: true,        // Show control bar
    initialZoom: 1.2,          // 120% zoom
    autoFit: false,            // Disable auto-fit
    showThumbnails: true       // Show thumbnail panel
  };
  
  onPageChange(page: number) {
    console.log('Current page:', page);
  }
  
  onDocumentLoaded(document: any) {
    console.log('PDF loaded:', document.numPages, 'pages');
  }
}
```

## 🎯 Auto-Fit vs Manual Zoom Controls

### How Auto-Fit Works

The `autoFit` feature (enabled by default) automatically scales PDFs to fit your container:

- **Responsive**: Adapts to container width changes
- **Scale bounds**: Between 10% and 300% for readability  
- **Container-aware**: Calculates optimal zoom based on available space

### Important: Auto-Fit vs Manual Zoom Interaction

⚠️ **When `autoFit: true` (default), manual zoom controls may not work as expected:**

```typescript
// With auto-fit enabled (default):
pdfOptions: PdfOptions = {
  showControls: true,     // Shows zoom controls
  autoFit: true          // But auto-fit overrides manual changes!
};
```

### Solutions:

**Option 1: Disable Auto-Fit for Manual Control**
```typescript
pdfOptions: PdfOptions = {
  autoFit: false,         // Disable auto-fit
  initialZoom: 1.0,       // Set desired zoom
  showControls: true      // Manual controls work normally
};
```

**Option 2: Use Auto-Fit Only (Recommended)**
```typescript
pdfOptions: PdfOptions = {
  autoFit: true,          // Let auto-fit handle everything
  showControls: false     // Hide manual controls to avoid confusion
  // PDF scales automatically - no manual intervention needed
};
```

## 📱 Container CSS Best Practices

```css
/* ✅ Good - Let the PDF scale naturally */
.pdf-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* ❌ Avoid - These can cause rendering issues */
.pdf-container {
  overflow: hidden;         /* Can cut off content */
  height: 400px;           /* Fixed height without overflow: auto */
  max-width: 300px;        /* Too restrictive */
}
```

## 🔧 Advanced Features

### Event Handling

```typescript
@Component({
  template: `
    <ng-pdf-viewer 
      [src]=\"pdfUrl\"
      (pageChange)=\"onPageChange($event)\"
      (documentLoaded)=\"onDocumentLoaded($event)\"
      (documentLoadError)=\"onError($event)\">
    </ng-pdf-viewer>
  `
})
export class AdvancedPdfComponent {
  onPageChange(pageNumber: number) {
    console.log(`User navigated to page ${pageNumber}`);
  }
  
  onDocumentLoaded(document: any) {
    console.log(`PDF loaded with ${document.numPages} pages`);
  }
  
  onError(error: any) {
    console.error('PDF loading failed:', error);
  }
}
```

### Loading from Different Sources

```typescript
export class PdfSourcesComponent {
  // Local file
  localPdf = '/assets/document.pdf';
  
  // External URL
  externalPdf = 'https://example.com/document.pdf';
  
  // Base64 data
  base64Pdf = 'data:application/pdf;base64,JVBERi0xLjQK...';
  
  // Uint8Array (from file upload)
  arrayBuffer: Uint8Array;
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.arrayBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**PDF not displaying:**
```typescript
// Check console for errors
// Ensure PDF URL is accessible
// Verify CORS headers for external PDFs
```

**Text selection not working:**
```typescript
pdfOptions: PdfOptions = {
  enableTextSelection: true,  // Ensure this is true
  renderTextLayer: true       // Required for text selection
};
```

**Manual zoom controls not responding:**
```typescript
pdfOptions: PdfOptions = {
  autoFit: false,             // Disable auto-fit
  showControls: true,         // Show controls
  initialZoom: 1.0            // Set desired zoom
};
```

**PDF too large/small:**
```typescript
pdfOptions: PdfOptions = {
  autoFit: true,              // Let auto-fit handle sizing
  initialZoom: undefined      // Don't override auto-fit
};
```

**Performance issues:**
```typescript
pdfOptions: PdfOptions = {
  renderAnnotationLayer: false,  // Disable if not needed
  showThumbnails: false          // Disable heavy features
};
```

## 🔧 Browser Support

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅  
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅

## 📋 Requirements

- **Angular**: 19.1.0 or higher
- **Node.js**: 18.0.0 or higher
- **TypeScript**: 5.0 or higher

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT © [askinjohn](https://github.com/askinjohn)

## 🔗 Links

- [GitHub Repository](https://github.com/askinjohn/ng-pdf-renderer)
- [npm Package](https://www.npmjs.com/package/ng-pdf-renderer)
- [Issue Tracker](https://github.com/askinjohn/ng-pdf-renderer/issues)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

---

**Made with ❤️ for the Angular community**

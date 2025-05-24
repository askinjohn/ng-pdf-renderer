# ng-pdf-renderer

A simple PDF viewer for Angular applications with zero configuration required.

## Features

- ✅ **Zero setup** - No manual PDF.js worker configuration needed
- ✅ **Text selection** - Select and copy text from PDFs
- ✅ **Search** - Find text across all pages
- ✅ **Controls** - Optional navigation, zoom, print, and download
- ✅ **Responsive** - Auto-fits container width
- ✅ **Modern Angular** - Built with Angular 19 standalone components

## Installation

```bash
npm install ng-pdf-renderer
```

## Basic Usage

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

@Component({
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <ng-pdf-viewer [src]="pdfUrl"></ng-pdf-viewer>
  `
})
export class MyComponent {
  pdfUrl = '/assets/document.pdf';
}
```

## With Controls

```typescript
import { PdfViewerComponent, PdfOptions } from 'ng-pdf-renderer';

@Component({
  template: `
    <ng-pdf-viewer 
      [src]="pdfUrl" 
      [options]="options">
    </ng-pdf-viewer>
  `
})
export class MyComponent {
  pdfUrl = 'https://example.com/document.pdf';
  
  options: PdfOptions = {
    height: '600px',
    showControls: true
  };
}
```

## Configuration Options

```typescript
interface PdfOptions {
  // Display
  height?: string;              // Container height (default: '500px')
  width?: string;               // Container width (default: '100%')
  
  // Controls
  showControls?: boolean;       // Show control bar (default: false)
  showNavigation?: boolean;     // Page navigation buttons
  showZoomControls?: boolean;   // Zoom in/out buttons
  showDownloadButton?: boolean; // Download button
  showPrintButton?: boolean;    // Print button
  showSearchBar?: boolean;      // Search functionality
  
  // View
  initialZoom?: number;         // Starting zoom level (default: auto-fit)
  initialPage?: number;         // Starting page (default: 1)
  enableTextSelection?: boolean; // Allow text selection (default: true)
}
```

## Events

```typescript
@Component({
  template: `
    <ng-pdf-viewer 
      [src]="pdfUrl"
      (pageChange)="onPageChange($event)"
      (documentLoaded)="onDocumentLoaded($event)">
    </ng-pdf-viewer>
  `
})
export class MyComponent {
  onPageChange(page: number) {
    console.log('Current page:', page);
  }
  
  onDocumentLoaded(doc: any) {
    console.log('PDF loaded with', doc.numPages, 'pages');
  }
}
```

## Loading Different PDF Sources

```typescript
// From URL
pdfUrl = 'https://example.com/document.pdf';

// From assets
pdfUrl = '/assets/document.pdf';

// From file upload
onFileSelected(event: any) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    this.pdfData = new Uint8Array(e.target?.result as ArrayBuffer);
  };
  reader.readAsArrayBuffer(file);
}
```

## Requirements

- Angular 19+
- Modern browsers with ES2022 support

## License

MIT
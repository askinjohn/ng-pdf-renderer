# ng-pdf-renderer

A modern, zero-configuration Angular PDF viewer component with built-in controls for navigation, zoom, rotation, search, print, and download.

## Features

- ✅ **Zero Configuration** - Automatically configures PDF.js worker
- ✅ **Continuous Scrolling** - View all pages in a single scrollable view
- ✅ **Text Selection** - Select and copy text from PDFs
- ✅ **Search** - Find text within PDFs with highlighting
- ✅ **Navigation** - Page controls with automatic current page tracking
- ✅ **Zoom & Rotation** - Built-in zoom and rotation controls
- ✅ **Print & Download** - Easy print and download functionality
- ✅ **Responsive** - Auto-fits to container width
- ✅ **High-DPI Support** - Sharp rendering on retina displays
- ✅ **Modern Angular** - Standalone components with signals

## Installation

```bash
npm install ng-pdf-renderer
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <ng-pdf-viewer 
      [src]="pdfUrl"
      [options]="pdfOptions">
    </ng-pdf-viewer>
  `
})
export class AppComponent {
  pdfUrl = '/assets/sample.pdf';
  
  pdfOptions = {
    height: '800px',
    showControls: true,
    enableTextSelection: true,
    autoFit: true
  };
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | string \| Uint8Array | required | PDF source (URL or byte array) |
| `options.height` | string | '600px' | Container height |
| `options.showControls` | boolean | true | Show navigation controls |
| `options.enableTextSelection` | boolean | true | Enable text selection |
| `options.autoFit` | boolean | true | Auto-fit PDF to container width |
| `options.initialZoom` | number | 1 | Initial zoom level |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# ng-pdf-renderer 📄

A modern, zero-configuration PDF viewer for Angular applications with intelligent auto-fit, text selection, and responsive design.

[![npm version](https://badge.fury.io/js/ng-pdf-renderer.svg)](https://badge.fury.io/js/ng-pdf-renderer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-19+-red.svg)](https://angular.io/)

## 🚀 Quick Start

```bash
npm install ng-pdf-renderer
```

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

@Component({
  selector: 'app-pdf-demo',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `<ng-pdf-viewer [src]=\"pdfUrl\"></ng-pdf-viewer>`
})
export class PdfDemoComponent {
  pdfUrl = '/assets/document.pdf';
}
```

## ✨ Features

- 🚀 **Zero Configuration** - Works out of the box
- 📱 **Auto-Fit & Responsive** - Adapts to any container size  
- 📝 **Text Selection** - Copy text directly from PDFs
- 🔍 **Search, Print, Download** - Built-in functionality
- 🎯 **Modern Angular** - Standalone components, Angular 19+
- 🛠️ **Auto PDF.js Setup** - No manual configuration needed

## 📚 Documentation

For complete documentation, examples, and configuration options, see the [full README](./projects/ng-pdf-renderer/README.md).

## 🏗️ Development

This repository contains:

- **Library**: `./projects/ng-pdf-renderer/` - The npm package source
- **Test App**: `./projects/pdf-test-app/` - Development testing application

### Build & Test

```bash
# Install dependencies
npm install

# Build the library
ng build ng-pdf-renderer

# Run test application
ng serve pdf-test-app

# Publish to npm
npm publish dist/ng-pdf-renderer
```

## 📄 License

MIT © [askinjohn](https://github.com/askinjohn)

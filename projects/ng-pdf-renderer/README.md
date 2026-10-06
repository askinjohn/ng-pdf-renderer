# ng-pdf-renderer

A standalone Angular PDF viewer backed by PDF.js. This workspace targets Angular 22 and PDF.js 6. The upgrade is unreleased and requires a major package release because Angular 19 applications cannot use this build.

## Installation

For published releases, use `npm install ng-pdf-renderer` and check that release's Angular peer dependencies. This README describes unreleased source version 2.0.0. To try it locally, build the repository with `npm run build` and install its `dist/ng-pdf-renderer` directory into an Angular 22 application.

## Usage

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent, PdfOptions } from 'ng-pdf-renderer';

@Component({
  selector: 'app-document',
  imports: [PdfViewerComponent],
  template: `<ng-pdf-viewer [src]="source" [options]="options"
    (documentLoadError)="onError($event)" />`
})
export class DocumentComponent {
  source: string | Uint8Array = '/assets/document.pdf';
  options: PdfOptions = { height: '600px', showControls: true, showThumbnails: true, showOutline: true };
  onError(error: unknown) { console.error(error); }
}
```

Each viewer owns its document, navigation, zoom, and rotation state. Replacing `src` reloads the document; use a new options object when changing settings. URL sources require appropriate CORS headers. Binary data is copied before being passed to PDF.js so the caller's buffer remains usable.

## Implemented features

- Continuous pages with canvas rendering when pages enter the viewport.
- High-DPI canvas rendering and selectable text.
- Auto-fit on container width changes, page navigation, zoom, and quarter-turn rotation.
- External links and named/object-reference internal destinations.
- Case-insensitive substring search within individual PDF text items; navigation to the first match and highlighting on rendered pages.
- Lazy page thumbnails with bounded rendering concurrency and nested bookmark navigation.
- Interactive AcroForm text/textarea, checkbox, radio, and choice widgets; field edits survive rerendering and are included in downloads/printing.
- Password prompts for encrypted documents, incorrect-password retry, and cancellation.
- PDF download and browser-dependent printing.
- Document load/error and current-page events.

## Options

| Option | Default | Behavior |
| --- | --- | --- |
| `height`, `width` | `500px`, `100%` | Viewer dimensions |
| `autoFit` | `true` | Fit the first page's width to the container |
| `initialZoom` | unset | Explicit initial zoom disables auto-fit |
| `initialPage` | `1` | Clamped to the document's page range |
| `showControls` | `false` | Show the toolbar |
| `showNavigation`, `showZoomControls`, `showRotationControls` | `true` | Toolbar groups |
| `showDownloadButton`, `showPrintButton`, `showSearchBar` | `true` | Toolbar actions |
| `renderTextLayer`, `enableTextSelection` | `true` | Both must be enabled to create selectable text |
| `renderAnnotationLayer` | `true` | Links and AcroForm widgets |
| `renderForms` | `true` | Render interactive AcroForm fields; requires annotation layer |
| `workerSrc` | matching CDN worker | Override the PDF.js worker URL |
| `showThumbnails`, `showOutline` | `false` | Open page previews or nested bookmarks; toolbar buttons also toggle these panels |

Manual zoom disables auto-fit until the source or options change. Zoom is limited to 10–500%; auto-fit is limited to 10–300%. PDF page rotation is preserved in addition to the viewer's rotation.

## Workers and offline deployment

By default, PDF.js uses an exact-version worker from unpkg. This requires network access and compatible CSP. For offline use or a strict CSP, serve `node_modules/pdfjs-dist/build/pdf.worker.mjs` from your own assets and set `workerSrc` to its URL. Worker and library versions must match. This setting affects PDF.js globally; viewers must use the same PDF.js version.

Global configuration is available through `NgPdfRendererConfigService.setConfig({ workerSrc })` before the first load. A viewer's `options.workerSrc` can also select the worker. Reconfigure the global service rather than mutating the returned configuration object.

### Copy and configure a local worker

Add this entry to your application's `build.options.assets` in `angular.json`:

```json
{
  "glob": "pdf.worker.mjs",
  "input": "node_modules/pdfjs-dist/build",
  "output": "assets/pdfjs"
}
```

Set it before the first viewer loads in your `app.config.ts`:

```typescript
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { NgPdfRendererConfigService } from 'ng-pdf-renderer';

export const appConfig: ApplicationConfig = {
  providers: [provideAppInitializer(() => {
    inject(NgPdfRendererConfigService).setConfig({
      workerSrc: new URL('assets/pdfjs/pdf.worker.mjs', document.baseURI).href
    });
  })]
};
```

This example is for browser applications. The relative URL respects the application's base path. If serving assets elsewhere, use that URL instead. No global viewer stylesheet is needed; the component owns its rendering styles.

## Events

| Output | Value |
| --- | --- |
| `documentLoaded` | Loaded PDF.js document proxy |
| `documentLoadError` | Load, navigation, rendering or action error |
| `pageChange` | Current page number |

## Compatibility

- Angular 22.2.x; Angular common, core, and forms plus RxJS are peer dependencies.
- Angular's compiler currently requires TypeScript 6.0.x. TypeScript 7 is incompatible.
- Node: `^22.22.3 || ^24.15.0 || >=26.0.0` for this workspace/toolchain.
- Modern browsers supported by Angular 22 and PDF.js 6. Browser verification currently covers Chrome.
- SSR/hydration support is not certified. Rendering requires browser DOM/canvas APIs, and PDF.js is imported eagerly.

## Forms and encrypted PDFs

AcroForm field edits are stored in PDF.js annotation storage. `PdfService.getDocumentData()` returns bytes including those edits, and the built-in Download/Print actions use those bytes. Changing zoom, rotation, options, or panel visibility preserves edits. Replacing the source starts a new document and clears old state. Use `renderForms: false` for a static view.

Password prompts appear automatically, with keyboard focus, incorrect-password feedback, retry, and Cancel/Escape. Password values are cleared on submission; the viewer does not persist them. Service consumers can subscribe to `passwordRequest$`, call `submitPassword(value)`, and cancel by calling `clearDocument()`.

## Current limitations

XFA forms, signature editing/verification, PDF JavaScript actions/calculations, push-button actions, comment editing, custom HTTP headers/credentials, search result counts/next/previous, and matching across text-item boundaries are not implemented. PDF.js can supply several of these capabilities, but this wrapper does not expose them yet.

Rendering is lazy, but page metadata is fetched sequentially for every placeholder and visited canvases remain in memory. Very large documents need bounded rendering concurrency and canvas eviction. Printing uses the browser's embedded PDF support and needs cross-browser validation. Tagged-PDF accessibility and screen-reader reading order require further work.

See `PROJECT_REVIEW.md` in the source repository for the review and roadmap.

## Development

```bash
npm ci
npm run build
npm run build:demo
npx playwright install chromium
npm run test:ci
```

To use an already installed Chrome browser, set `CHROME_BIN` to its executable instead of installing Chromium. Tests run in a real browser and include a small self-contained PDF; test rendering does not depend on a CDN.

The demo's `/features` route includes local form/bookmark and password-protected fixtures. Its worker is served locally from `/assets/pdfjs/pdf.worker.mjs`, so the feature demo does not depend on a CDN. Regenerate the synthetic fixtures with `python3 projects/ng-pdf-renderer/src/testing/build-fixtures.py` if needed (requires the development-only Python package `pypdf`).

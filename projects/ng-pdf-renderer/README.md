# ng-pdf-renderer

A standalone Angular PDF viewer powered by PDF.js, with navigation, selectable text, search, thumbnails, bookmarks, fillable forms, and password prompts.

[npm](https://www.npmjs.com/package/ng-pdf-renderer) · [Source](https://github.com/askinjohn/ng-pdf-renderer) · [Issues](https://github.com/askinjohn/ng-pdf-renderer/issues)

## Installation

```bash
npm install ng-pdf-renderer
```

Version 2.0.0 requires Angular `^22.2.1` and RxJS `^7.8.2`. For earlier Angular versions, use a compatible previous release. Rendering requires browser DOM and canvas APIs. SSR and hydration support have not been verified.

## Usage

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent, type PdfOptions } from 'ng-pdf-renderer';

@Component({
  selector: 'app-document',
  imports: [PdfViewerComponent],
  template: `
    <ng-pdf-viewer
      [src]="source"
      [options]="options"
      (documentLoadError)="onError($event)"
    />
  `,
})
export class DocumentComponent {
  source: string | Uint8Array = '/documents/example.pdf';
  options: PdfOptions = {
    height: '600px',
    showControls: true,
    showThumbnails: true,
    showOutline: true,
  };

  onError(error: unknown): void {
    console.error('Unable to display PDF:', error);
  }
}
```

Serve the PDF at the specified URL, or pass its bytes as a `Uint8Array`. Cross-origin URLs must allow CORS. Replacing `src` loads a new document; replace the options object when changing settings. Each viewer maintains independent document and navigation state.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `height` | `500px` | Viewer height |
| `width` | `100%` | Viewer width |
| `autoFit` | `true` | Fit the first page's width to the container |
| `initialZoom` | — | Initial scale; `1` means 100%. Disables auto-fit when set. |
| `initialPage` | `1` | Starting page, clamped to the document's range |
| `showControls` | `false` | Show the toolbar |
| `showNavigation` | `true` | Show page navigation in the toolbar |
| `showZoomControls` | `true` | Show zoom controls in the toolbar |
| `showRotationControls` | `true` | Show rotation controls in the toolbar |
| `showDownloadButton` | `true` | Show the download action in the toolbar |
| `showPrintButton` | `true` | Show the print action in the toolbar |
| `showSearchBar` | `true` | Show search in the toolbar |
| `showThumbnails` | `false` | Open the page preview panel |
| `showOutline` | `false` | Open the bookmark panel |
| `renderTextLayer` | `true` | Render the text layer |
| `enableTextSelection` | `true` | Enable selection; requires the text layer |
| `renderAnnotationLayer` | `true` | Render links and form annotations |
| `renderForms` | `true` | Enable interactive AcroForms; requires annotations |
| `workerSrc` | Version-matched CDN URL | Override the PDF.js worker location |

Manual zoom disables auto-fit until the source or options change. Zoom supports 10–500%; auto-fit supports 10–300%.

## Events

| Event | Value |
| --- | --- |
| `documentLoaded` | Loaded PDF.js document proxy |
| `documentLoadError` | Load, navigation, rendering, or action error |
| `pageChange` | Current page number |

## Worker configuration

By default, the viewer loads a version-matched PDF.js worker from unpkg. This requires network access and permission under your application's Content Security Policy. To serve the worker locally:

Add this entry to your application's `build.options.assets` in `angular.json`:

```json
{
  "glob": "pdf.worker.mjs",
  "input": "node_modules/pdfjs-dist/build",
  "output": "assets/pdfjs"
}
```

Add the initializer below to your existing `app.config.ts` providers:

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

The worker must match the installed PDF.js version. Configuration applies globally to PDF.js; configure it before loading a document. You can also set `options.workerSrc` for the viewer. All viewers must use a compatible worker.

## Forms and passwords

Text fields, multiline fields, checkboxes, radio buttons, and choice fields are supported. Edits survive zoom, rotation, and panel changes, and are included in downloads and printing. Thumbnails refresh after edits. Set `renderForms: false` for a static view. Loading a different source clears the previous document's edits.

Encrypted documents prompt for a password, with retry and cancellation. Passwords are cleared on submission and are not persisted by the viewer.

## Limitations

- Search matches text within individual PDF text items. Cross-item matches, result counts, and next/previous result navigation are not supported.
- XFA, signature editing or verification, PDF JavaScript, push-button actions, and comment editing are not supported.
- Custom HTTP headers and credentials are not exposed by the loading API.
- Visited page canvases remain in memory, so very large documents may use substantial memory.
- Printing depends on the browser's PDF support. Automated browser coverage currently targets Chrome; other browsers, tagged-PDF reading order, and screen-reader accessibility need further validation.

For source setup, tests, and contribution guidance, see the [GitHub repository](https://github.com/askinjohn/ng-pdf-renderer).

## Troubleshooting

| Problem | Check |
| --- | --- |
| PDF does not load | Confirm the URL returns a PDF and the server permits CORS. Subscribe to `documentLoadError`. |
| Worker fails to load | Check the worker URL, Content Security Policy, and matching PDF.js version. |
| Toolbar is missing | Set `showControls: true`. |
| Options do not update | Assign a new `PdfOptions` object rather than mutating the existing object. |

Report issues with a minimal reproduction, Angular/package versions, and browser details. Remove private document content before sharing examples.

## License

MIT © [askinjohn](https://github.com/askinjohn)

# ng-pdf-renderer

A standalone Angular PDF viewer powered by PDF.js. Display documents with selectable text, navigation, search, thumbnails, bookmarks, and fillable forms.

[npm](https://www.npmjs.com/package/ng-pdf-renderer) · [API reference](./projects/ng-pdf-renderer/README.md) · [Changelog](./projects/ng-pdf-renderer/CHANGELOG.md) · [Issues](https://github.com/askinjohn/ng-pdf-renderer/issues)

## Features

- Responsive page fitting, zoom, and rotation
- Text selection, search, and document links
- Page thumbnails and nested bookmarks
- AcroForm fields with edits preserved in downloads
- Password prompts for encrypted PDFs
- Download and browser printing

## Installation

```bash
npm install ng-pdf-renderer
```

> Version 2.0.0 requires Angular `^22.2.1`. For earlier Angular versions, use a compatible previous release.

## Quick start

Import the standalone component and provide a PDF URL or `Uint8Array`:

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent, type PdfOptions } from 'ng-pdf-renderer';

@Component({
  selector: 'app-document',
  imports: [PdfViewerComponent],
  template: `
    <ng-pdf-viewer [src]="source" [options]="options" />
  `,
})
export class DocumentComponent {
  source = '/documents/example.pdf';
  options: PdfOptions = {
    height: '600px',
    showControls: true,
    showThumbnails: true,
    showOutline: true,
  };
}
```

Serve your PDF at the specified URL. Documents hosted on another origin must allow CORS. The toolbar is hidden by default; set `showControls: true` to enable it.

The PDF.js worker loads from a version-matched CDN by default. For offline use or a strict Content Security Policy, [serve the worker locally](./projects/ng-pdf-renderer/README.md#worker-configuration). No global viewer stylesheet is required.

## Documentation

See the [configuration reference](./projects/ng-pdf-renderer/README.md) for options, events, worker setup, and supported PDF features.

## Development

Use a supported Node version: `^22.22.3 || ^24.15.0 || >=26.0.0`.

```bash
npm ci
npm start
```

Open [localhost:4200/features](http://localhost:4200/features) to try forms, bookmarks, and encrypted PDFs. The encrypted sample password is `viewer-test`. Startup builds the local library and serves the demo with a local worker.

To run both production builds and the browser tests:

```bash
npx playwright install chromium
npm run check
```

You can set `CHROME_BIN` to an installed Chrome executable instead of downloading Chromium. For library changes, run `npm run watch` in a separate terminal; restart the demo if a rebuild interrupts package resolution.

See the [contributor guide](./AGENTS.md) for development guidance and the [configuration reference](./projects/ng-pdf-renderer/README.md#limitations) for current limitations.

## Support

Found a problem? [Open an issue](https://github.com/askinjohn/ng-pdf-renderer/issues) with your Angular and package versions, browser, worker setup, and a minimal reproduction. Share only PDFs you have permission to make public.

## License

MIT © [askinjohn](https://github.com/askinjohn)

# ng-pdf-renderer

An Angular PDF viewer powered by PDF.js, with selectable text, page navigation, zoom, rotation, search, thumbnails, nested bookmarks, fillable AcroForms, and password prompts.

**Release status:** this repository contains unreleased version 2.0.0 targeting Angular 22.2 and PDF.js 6. Installing from npm may give you an older release with different compatibility and features. The source upgrade needs a major release.

## Run the project

Use Node `^22.22.3 || ^24.15.0 || >=26.0.0` and run these commands from the repository root:

```bash
npm ci
npm start
```

`npm start` builds the library first, then serves the demo. Open [the feature demo](http://localhost:4200/features). The demo uses local PDFs and a local PDF.js worker. The encrypted sample password is `viewer-test`.

After editing library source, stop the demo and run `npm start` again. For continuous library builds, use `npm run watch` in another terminal after the initial build. If rebuilding removes the output briefly and the demo reports it cannot resolve `ng-pdf-renderer`, restart the demo.

## Use the viewer

For a published version compatible with your Angular application:

```bash
npm install ng-pdf-renderer
```

For this unreleased source, run `npm run build`, then install the resulting `dist/ng-pdf-renderer` directory into your Angular 22 application.

```typescript
import { Component } from '@angular/core';
import { PdfViewerComponent, type PdfOptions } from 'ng-pdf-renderer';

@Component({
  selector: 'app-document',
  imports: [PdfViewerComponent],
  template: `<ng-pdf-viewer [src]="source" [options]="options"
    (documentLoadError)="onError($event)" />`
})
export class DocumentComponent {
  source = '/assets/document.pdf';
  options: PdfOptions = { height: '600px', showControls: true,
    showThumbnails: true, showOutline: true };
  onError(error: unknown) { console.error(error); }
}
```

Place the PDF at the served URL. URL sources need CORS permission when hosted on another origin; `Uint8Array` sources are also supported. Controls are hidden by default. Replace the options object when changing settings.

The default worker downloads from unpkg and needs network/CSP permission. For offline deployments, follow the [local worker configuration](./projects/ng-pdf-renderer/README.md#workers-and-offline-deployment). No global PDF.js stylesheet is required for the component.

## Validate changes

```bash
npx playwright install chromium
npm run check
```

`check` builds the library and demo, then runs the real-browser Vitest suite once. To use installed Chrome instead of downloading Chromium, set `CHROME_BIN` to its executable. On macOS:

```bash
CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run check
```

Tests use generated local PDF fixtures. Existing demo bundle/style budget warnings are recorded in the [project review](./PROJECT_REVIEW.md). A passing suite is not a guarantee that every PDF format or browser is supported.

## Project map

- [Library documentation](./projects/ng-pdf-renderer/README.md): options, compatibility, forms, workers, and limitations.
- [Agent guidance](./AGENTS.md): entry points, development rules, and verification workflow.
- [Manual testing guide](./DEFAULT-TESTING-README.md): demo routes and UI checks.
- [Project review](./PROJECT_REVIEW.md): known gaps and release readiness.
- `projects/ng-pdf-renderer/src/lib`: library components, service, configuration, and models.
- `projects/pdf-test-app/src/app`: demo application.

MIT © [askinjohn](https://github.com/askinjohn)

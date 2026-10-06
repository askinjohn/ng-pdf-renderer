# Contributor and agent guide

## Scope and release state

This is an Angular 22.2 workspace containing an unreleased 2.0.0 library and a demo. Read README.md and PROJECT_REVIEW.md before changing behavior. The published npm package may differ from this source. Keep changes scoped; preserve existing uncommitted work.

## Entry points

- Public exports: projects/ng-pdf-renderer/src/public-api.ts
- Viewer and rendering lifecycle: projects/ng-pdf-renderer/src/lib/components/pdf-viewer.component.ts
- Toolbar: projects/ng-pdf-renderer/src/lib/components/pdf-controls.component.ts
- Thumbnails/bookmarks: projects/ng-pdf-renderer/src/lib/components/pdf-sidebar.component.ts
- Loading, password handling, destinations and saved bytes: projects/ng-pdf-renderer/src/lib/services/pdf.service.ts
- Public options: projects/ng-pdf-renderer/src/lib/models/pdf-options.model.ts
- Global worker configuration: projects/ng-pdf-renderer/src/lib/ng-pdf-renderer.config.ts
- Browser regression tests: component/service *.spec.ts files
- Synthetic PDFs: projects/ng-pdf-renderer/src/testing; regeneration requires Python pypdf, normal builds do not
- Local demo: /features, including forms/bookmarks and password sample (viewer-test)

## Workflow

Use npm ci and the committed lockfile. npm start builds the library before serving the demo. The demo resolves the library from dist; rebuild after library edits and restart the server if a rebuild invalidates module resolution. npm run watch explicitly watches the library.

Run npm run check after behavioral changes. Install Chromium with npx playwright install chromium, or set CHROME_BIN to an installed Chrome executable. Use actual browser rendering tests for PDF regressions, with deterministic local fixtures. Check relevant UI visually, including keyboard focus and narrow screens. Do not claim browser/PDF coverage beyond what was verified.

## Implementation constraints

Keep each viewer's PdfService scoped so documents, form fields, and navigation remain isolated. Cancel render tasks and guard asynchronous results when sources/options change or the component is destroyed. Preserve PDF.js annotation storage through rerenders, and use original PDF annotation IDs for saved values. Keep DOM IDs/names unique per viewer. PDF.js library and worker versions must match; the demo worker is copied from node_modules via angular.json.

Use existing Angular standalone components and signals. Preserve public API compatibility unless explicitly changing the release contract. Update both READMEs when public behavior or setup changes. SSR, XFA, signatures, PDF JavaScript, advanced search, and large-document canvas eviction are not certified/implemented; document limitations accurately. Do not publish a package as part of routine verification.

<!-- beacon:start -->
When implementing an agreed change, use Beacon sync_project if available to publish a short plan with stable project/task keys. Batch meaningful status transitions with update_tasks. Include only concise task metadata; never send code, diffs, commands, output, secrets, or reasoning. Omit unknown identity/progress values. Reporter failure must not stop implementation, and do not repeatedly retry an unavailable reporter.
<!-- beacon:end -->

# Project review

## Assessment

This is an Angular PDF **viewer**, using PDF.js as the rendering engine. It does not generate PDF documents from Angular templates. Existing Angular viewers include ngx-extended-pdf-viewer (https://pdfviewer.net/) and ng2-pdf-viewer (https://github.com/VadimDez/ng2-pdf-viewer). A useful positioning is a small standalone viewer with straightforward defaults, predictable lifecycle behavior, and documented deployment requirements.

The current project is a workable foundation, but it does not yet cover everything needed for a general-purpose production PDF viewer.

## Fixed in this review

- Separate service state for each viewer.
- Reload on source/options replacement, with stale load suppression.
- Destroy old loading tasks and documents; copy binary input to avoid detaching caller buffers.
- Cancel canvas/text render tasks and disconnect observers on rerender/destruction.
- Prevent stale placeholder/render work from continuing into a newer render generation.
- Keep manual zoom instead of resetting it to auto-fit; resize-aware automatic fitting.
- Apply viewer rotation once and preserve PDF page rotation.
- Use PDF.js 6 TextLayer APIs and required CSS sizing/scaling/rotation rules.
- Respect `renderTextLayer: false`.
- Keep link hit targets above selectable text while allowing selection elsewhere.
- Resolve internal destinations through PDF.js instead of mistaking object IDs for page numbers.
- Synchronize scroll-derived page state back to the navigation service.
- Validate page, zoom, and rotation values; normalize null outlines; ignore non-text search items.
- Ignore stale asynchronous search results and avoid leaking print iframes when data loading fails.
- Set toolbar button types and accessible labels for icon/input controls.
- Add Angular forms/RxJS peer dependencies and restore the missing test configuration.
- Upgrade to current stable Angular/PDF.js and replace deprecated build/test tooling.

## Remaining work, in priority order

1. **Release compatibility:** this build targets Angular 22, so publish as a major release. Test an installed package in a separate consumer project before publishing. Do not claim Angular 19 compatibility.
2. **Worker deployment:** provide a packaged/local-worker installation path and sample strict CSP/offline deployment. The default still uses a CDN.
3. **Large documents:** bound rendering concurrency, evict offscreen canvases, avoid eagerly fetching every page's metadata, and benchmark mixed page sizes and hundreds of pages.
4. **Loading API:** expose authentication headers, credentials, progress, explicit cancellation, and useful typed errors.
5. **Advanced PDF features:** XFA forms, signature editing/verification, push-button actions, embedded JavaScript calculations, and comment editing remain unsupported. Standard AcroForms, thumbnails, and nested bookmark panels are implemented.
6. **Search:** match across text-item boundaries, count results, support next/previous match, cache extracted text, and add dedicated search completion/error events.
7. **SSR and accessibility:** avoid eager browser-only imports for SSR, test hydration/zoneless consumers, and provide semantic reading order, toolbar keyboard behavior, and accessible status announcements.
8. **Browser verification:** add Firefox/Safari, real dedicated-worker tests, printing/download tests, additional encryption algorithms/corrupt documents, complex forms, RTL/CJK text, and complex annotation fixtures. The current PDF integration test uses the local worker implementation in-process.
9. **Maintenance:** replace broad `any` types with PDF.js types, remove old debug code/styles/demo artifacts, add CI and package-consumer tests, and define supported-browser/version policies.

## Validation

Browser regression tests cover service validation, destination resolution, null outlines, marked-content search, viewer isolation, manual zoom, rapid source replacement, and observer/render cleanup. A generated PDF exercises real parsing, canvas rendering, text-layer sizing, rotation, links, and disabling the text layer. Library and demo production builds pass. The demo retains bundle/style budget warnings (approximately 795 kB initial raw JavaScript/CSS); those warnings remain visible. Dependency vulnerability counts are checked with npm audit; a clean audit is not a substitute for the browser matrix above.

## Feature follow-up

Added lazy thumbnail previews with two concurrent renders, nested outline navigation, toolbar panel toggles, native PDF.js AcroForm widgets with per-viewer DOM isolation and edit-preserving serialization, and password request/retry/cancellation UI. Option changes now rerender the current document rather than discard filled-in fields. New browser tests use generated local PDFs containing nested bookmarks, common widget types, and password encryption.

Validation after the feature follow-up: all 20 Chrome browser tests pass. Live demo checks also exercised editing and password retry/unlock using a real dedicated worker served locally. Production library and demo builds pass, with the existing demo budget warnings.

Thumbnail follow-up: both demo pages now contain visible document content and form appearance streams. Previews render annotation storage and refresh after form edits. Fixed stale appearance text overriding edited values when form layers rerender. All 20 Chrome tests pass, including assertions for thumbnail content and refreshed previews; library and demo production builds pass with the existing demo budget warnings.

Contributor readiness: root README now distinguishes unreleased source from npm releases, documents local worker setup and repeatable startup/check commands. AGENTS.md maps implementation entry points and lifecycle requirements. CI builds both projects and runs Chromium tests (first hosted run pending). Viewer controls now use visible focus and active panel states, responsive wrapping, and Enter-to-search. Desktop and 390px layouts checked manually. Also restored thumbnail observation after bookmark-panel toggles. Existing bundle/style warnings and large-document, cross-browser, SSR and tagged-PDF accessibility gaps remain.

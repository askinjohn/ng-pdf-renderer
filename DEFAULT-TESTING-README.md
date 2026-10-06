# Manual demo checks

From the repository root, run `npm ci`, then `npm start`. Open http://localhost:4200/features. The demo builds the local library and serves a matching worker locally; this is not a test of the published npm release.

## Routes

| Route | Purpose |
| --- | --- |
| `/features` | Local forms, thumbnails, bookmarks and password sample |
| `/simple` | Defaults: 500px height, auto-fit, selectable text, hidden controls |
| `/npm` | Interactive checklist using the local workspace package |
| `/clean` | Additional minimal viewer example |

## Checks

- Thumbnails show document content; selecting one navigates to its page.
- Nested bookmarks navigate correctly; panel toggles have visible active states.
- Type in a form, zoom/rotate/toggle panels, and confirm values remain. Download and reopen to check saved values.
- Open the encrypted sample with `viewer-test`; try an incorrect password, retry, and Cancel/Escape.
- Search a visible word with Enter and the Search button.
- Navigate controls using Tab and confirm visible focus.
- Check at desktop and narrow mobile widths for clipped controls or unusable scrolling.
- On `/simple`, confirm auto-fit, selection, hidden controls, source changes and resize behavior.

Run `npm run check` for builds and browser regression tests. See README.md for browser setup and PROJECT_REVIEW.md for unsupported features. A visual check of one sample does not certify arbitrary PDFs or all browsers.

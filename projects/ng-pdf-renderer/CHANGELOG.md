# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-26

### 🎯 Major Improvements

#### Fixed
- **Auto-fit algorithm completely rewritten** - Resolved left-side cutoff issues in small containers
- **Removed problematic minimum zoom restriction** - PDFs can now scale down properly to fit any container size
- **Eliminated infinite render loops** - Increased update threshold and improved change detection
- **Better responsive behavior** - Improved scaling for mobile and tablet devices

#### Changed
- **Default zoom changed from 2.0x to 1.0x** - More reasonable starting point, let auto-fit handle scaling
- **Improved page centering** - Pages now center properly with `margin: auto`
- **Better scale bounds** - Limited to 0.1x - 3.0x range for optimal readability
- **Enhanced margin calculation** - Responsive margins (20px mobile, 40px desktop)

#### Added
- **Comprehensive documentation** - Detailed README with examples, troubleshooting, and best practices
- **Default values documentation** - Clear explanation of all default behaviors
- **CSS best practices guide** - How to avoid common styling issues
- **Mobile optimization examples** - Responsive design patterns

### 🔧 Technical Details

#### Auto-Fit Algorithm
- Calculates scale based on container width minus appropriate margins
- No longer enforces minimum 1.5x zoom that caused cutoff issues
- Handles container width detection more reliably
- Prevents re-render loops with improved change detection

#### Container Compatibility
- Works properly with any container CSS (no more `overflow: hidden` conflicts)
- Handles dynamic container resizing
- Supports nested containers and flexbox layouts
- Mobile-friendly scaling and touch interactions

## [1.0.5] - 2025-01-25

### Added
- Initial release with basic PDF viewing functionality
- Auto-configuration of PDF.js worker
- Text selection and annotation support
- Basic auto-fit implementation

### Known Issues (Fixed in 1.1.0)
- Left-side cutoff in small containers due to minimum zoom restriction
- Potential infinite loops in auto-fit algorithm
- Pages not centering properly in containers

---

## Migration Guide

### From 1.0.x to 1.1.0

No breaking changes! All existing code will continue to work. However, you may notice:

- **Better scaling behavior** - PDFs will fit better in small containers
- **Improved centering** - Pages will center more reliably
- **No more cutoff issues** - Left-side content will always be visible

### Recommended Updates

If you were working around the cutoff issue:

```typescript
// Before (workaround no longer needed)
pdfOptions: PdfOptions = {
  autoFit: false,
  initialZoom: 0.8  // Manual scaling to prevent cutoff
};

// After (can use defaults)
// No options needed - auto-fit now works properly!
```

### CSS Improvements

```css
/* You can now safely use these container styles */
.pdf-container {
  width: 100%;
  max-width: 800px;
  /* overflow: hidden; */ /* No longer causes issues, but still not recommended */
}
```

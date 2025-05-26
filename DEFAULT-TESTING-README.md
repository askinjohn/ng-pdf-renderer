# 🚀 ng-pdf-renderer Default Testing Suite

This test setup allows you to easily test the `ng-pdf-renderer` package with **only default settings** to see how it performs out of the box.

## 📋 What's Included

### 1. **Mock PDF File** (`/assets/sample.pdf`)
- 2-page test document with selectable text
- Designed specifically for testing default behavior
- Contains instructions and success criteria

### 2. **Two Test Components**

#### Simple Test (`/simple`)
- Minimal implementation: `<ng-pdf-viewer [src]="pdfUrl"></ng-pdf-viewer>`
- Clean, focused testing environment
- Perfect for quick verification

#### NPM Package Test (`/npm`)
- Comprehensive testing interface
- Interactive checklist and questions
- Detailed success criteria
- Designed for thorough evaluation

## 🎯 Testing the Defaults

### Expected Default Behavior:
- **Height**: 500px
- **Width**: 100% of container
- **Controls**: Hidden (showControls = false)
- **Auto-fit**: Enabled (scales to fit width)
- **Text Selection**: Enabled
- **Continuous Scrolling**: All pages rendered

## 🚀 Quick Start

### Step 1: Build and Run
```bash
cd /Users/ajs_sb/Desktop/pdf-workspace

# Build the library
ng build ng-pdf-renderer

# Start the test app
ng serve pdf-test-app

# Open browser
open http://localhost:4200
```

### Step 2: Navigate the Tests
- **Simple Test**: `/simple` - Basic implementation
- **NPM Test**: `/npm` - Comprehensive testing

### Step 3: Test the Defaults
1. **Visual Check**: Does the PDF render at 500px height?
2. **Auto-fit**: Does it scale to fit the container width?
3. **Text Selection**: Can you select and copy text?
4. **Responsiveness**: How does it look when you resize the window?
5. **Controls**: Are control buttons hidden as expected?

## ❓ Key Questions to Answer

After testing, consider:

1. **Are the defaults good for most use cases?**
2. **Should the default height be different than 500px?**
3. **Is auto-fit working well on different screen sizes?**
4. **Would users expect controls to be visible by default?**
5. **Does the component handle edge cases well?**

## 🧪 Testing Checklist

- [ ] PDF loads without errors
- [ ] PDF appears at 500px height
- [ ] PDF fits container width nicely
- [ ] No control buttons are visible
- [ ] Text can be selected and copied
- [ ] No console errors in dev tools
- [ ] Looks good on mobile/tablet
- [ ] Smooth scrolling between pages
- [ ] Auto-fit responds to window resize

## 📱 Mobile Testing

Don't forget to test on different screen sizes:
- Desktop (1200px+)
- Tablet (768px - 1200px)
- Mobile (< 768px)

## 🔍 Browser Console

Check for any errors or warnings in the browser developer tools console (F12).

## 🎨 What You Should See

### Simple Test Page
```
📄 Simple Default Test
Pure defaults - just <ng-pdf-viewer [src]="pdfUrl"></ng-pdf-viewer>

[PDF renders here at 500px height]

Expected: 500px height, auto-fit width, no controls, text selectable
```

### NPM Test Page
A comprehensive testing interface with:
- Test instructions
- Interactive checklist
- Questions to evaluate
- Success criteria

## 🛠 For Development

If you want to modify the tests:

### File Locations:
- **Simple Test**: `src/app/simple-test.component.ts`
- **NPM Test**: `src/app/npm-test.component.ts`
- **Mock PDF**: `src/assets/sample.pdf`
- **Routing**: `src/app/app.routes.ts`

### Customizing Tests:
```typescript
// To test with custom options instead of defaults:
<ng-pdf-viewer 
  [src]="pdfUrl" 
  [options]="customOptions">
</ng-pdf-viewer>
```

## 🎯 Success = Defaults Work Great!

The goal is to verify that developers can use your package with **zero configuration** and get a great PDF viewing experience right out of the box.

---

**Happy Testing!** 🎉

If the defaults work well, your package is ready for prime time! If not, you'll know exactly what needs adjustment.

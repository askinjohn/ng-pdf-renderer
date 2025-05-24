# PDF Workspace

This workspace contains an Angular PDF rendering library (`ng-pdf-renderer`) and a test application to demonstrate its usage.

## Project Structure

- `projects/ng-pdf-renderer` - The PDF rendering library
- `projects/pdf-test-app` - Test application that uses the library

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Building the Library

```bash
# Build the library
ng build ng-pdf-renderer
```

### Running the Test Application

```bash
# Serve the test application
ng serve pdf-test-app
```

Then open your browser to http://localhost:4200

## Features

The PDF Renderer Library provides:

- PDF rendering using PDF.js
- Navigation controls (next/previous page)
- Zoom and rotation
- Search functionality
- Download and print options
- Custom configuration options

## Development

To work on both the library and test app simultaneously:

1. Start by building the library:

```bash
ng build ng-pdf-renderer --watch
```

2. In another terminal, run the test app:

```bash
ng serve pdf-test-app
```

This will automatically update the test app when you make changes to the library.

## Publishing the Library

To publish the library to npm:

```bash
# Build the library
ng build ng-pdf-renderer --prod

# Navigate to the distribution folder
cd dist/ng-pdf-renderer

# Publish to npm
npm publish
```
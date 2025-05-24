import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent, PdfOptions } from 'ng-pdf-renderer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PdfViewerComponent],
  template: `
    <div class="container">
      <h1>PDF Viewer Test App</h1>
      
      <div class="controls">
        <h3>Test Controls</h3>
        <button (click)="loadSamplePdf()">Load Sample PDF</button>
        <button (click)="loadAnotherPdf()">Load Another PDF</button>
        <label>
          PDF Height:
          <select (change)="updateHeight($event)">
            <option value="400px">400px</option>
            <option value="600px" selected>600px</option>
            <option value="800px">800px</option>
            <option value="100vh">Full Height</option>
          </select>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" [checked]="pdfOptions.showControls" (change)="toggleControls($event)">
          Show Controls
        </label>
      </div>
      
      <div class="pdf-container">
        <ng-pdf-viewer 
          [src]="pdfSrc" 
          [options]="pdfOptions"
          (pageChange)="onPageChange($event)"
          (documentLoaded)="onDocumentLoaded($event)"
          (documentLoadError)="onDocumentLoadError($event)">
        </ng-pdf-viewer>
      </div>
      
      <div class="status">
        <p *ngIf="status">Status: {{ status }}</p>
        <p *ngIf="error" class="error">Error: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    h1 {
      color: #2c3e50;
      text-align: center;
    }
    
    .controls {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    
    button {
      margin-right: 10px;
      padding: 8px 16px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: #2980b9;
    }
    
    label {
      margin-left: 20px;
    }
    
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      margin-left: 20px;
      cursor: pointer;
    }
    
    .checkbox-label input[type="checkbox"] {
      margin-right: 6px;
    }
    
    select {
      margin-left: 10px;
      padding: 6px;
    }
    
    .pdf-container {
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    
    .status {
      margin-top: 20px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    
    .error {
      color: #e74c3c;
    }
  `]
})
export class AppComponent {
  // PDF source URL
  pdfSrc: string = '/assets/Terminal_agreement.pdf';
  
  // PDF viewer options
  pdfOptions: PdfOptions = {
    height: '600px',
    width: '100%',
    // No need to set initialZoom now that we have auto-fit
    autoFit: true,
    initialZoom:1.0,
    showControls: false, // Default is now false
    showNavigation: true,
    showZoomControls: true,
    showRotationControls: true,
    showDownloadButton: true,
    showPrintButton: true,
    showSearchBar: true,
    enableTextSelection: true
  };
  
  // Status information
  status: string = '';
  error: string = '';
  
  // Load the default sample PDF
  loadSamplePdf(): void {
    this.pdfSrc = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
    this.status = 'Loading sample PDF...';
    this.error = '';
  }
  
  // Load another sample PDF
  loadAnotherPdf(): void {
    this.pdfSrc = 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';
    this.status = 'Loading another PDF...';
    this.error = '';
  }
  
  // Update PDF viewer height
  updateHeight(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pdfOptions = {
      ...this.pdfOptions,
      height: select.value
    };
    this.status = `Height updated to ${select.value}`;
  }
  
  // Event handlers
  onPageChange(pageNumber: number): void {
    this.status = `Navigated to page ${pageNumber}`;
  }
  
  onDocumentLoaded(document: any): void {
    this.status = `PDF loaded successfully with ${document.numPages} pages`;
    this.error = '';
  }
  
  onDocumentLoadError(error: any): void {
    this.error = `Failed to load PDF: ${error.message || 'Unknown error'}`;
    this.status = '';
  }

  // Toggle PDF controls visibility
  toggleControls(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.pdfOptions = {
      ...this.pdfOptions,
      showControls: checkbox.checked
    };
    this.status = `Controls ${checkbox.checked ? 'shown' : 'hidden'}`;
  }
}
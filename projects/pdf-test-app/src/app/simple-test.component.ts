import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

@Component({
  selector: 'app-simple-test',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <div class="simple-test">
      <div class="header">
        <h2>📄 Simple Default Test</h2>
        <p>Pure defaults - just <code>&lt;ng-pdf-viewer [src]="pdfUrl"&gt;&lt;/ng-pdf-viewer&gt;</code></p>
        <p><strong>Using:</strong> Mozilla PDF.js sample document</p>
      </div>
      
      <div class="pdf-section">
        <ng-pdf-viewer [src]="pdfUrl"></ng-pdf-viewer>
      </div>
      
      <div class="footer">
        <p>Expected: 500px height, auto-fit width, no controls, text selectable</p>
      </div>
    </div>
  `,
  styles: [`
    .simple-test {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      min-height: 100vh;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .header h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
      margin: 5px 0;
    }
    
    .header code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    .pdf-section {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 8px;
      /* REMOVED: overflow: hidden - this was cutting off PDF content */
      background: #f8f9fa;
    }
    
    .footer {
      text-align: center;
      padding: 15px;
      background: #e8f4fd;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }
    
    .footer p {
      margin: 0;
      color: #666;
      font-style: italic;
    }
  `]
})
export class SimpleTestComponent {
  // Using a known working PDF URL instead of local file for now
  pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
}

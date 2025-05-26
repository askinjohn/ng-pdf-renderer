import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

@Component({
  selector: 'app-clean-test',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <div class="clean-container">
      <h2>🧹 Clean Test - No CSS Interference</h2>
      <p>This test has minimal CSS to verify the PDF renders properly without style conflicts.</p>
      
      <!-- Absolutely minimal wrapper with no styling that could interfere -->
      <div class="pdf-wrapper">
        <ng-pdf-viewer [src]="pdfUrl" [options]="{showControls:true,autoFit:false}"></ng-pdf-viewer>
      </div>
    </div>
  `,
  styles: [`
    /* MINIMAL CSS - Only basic styling, nothing that could interfere with PDF */
    .clean-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .clean-container h2 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .clean-container p {
      color: #666;
      margin-bottom: 30px;
    }
    
    /* CRITICAL: pdf-wrapper has NO styling that could interfere */
    .pdf-wrapper {
      /* Intentionally minimal - no borders, overflow, height, etc. */
      background: transparent;
    }
  `]
})
export class CleanTestComponent {
  pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
}

import { Component } from '@angular/core';
import { PdfViewerComponent } from 'ng-pdf-renderer';

/**
 * Test component specifically for testing the ng-pdf-renderer npm package
 * with ONLY default settings - no custom options whatsoever
 */
@Component({
  selector: 'app-npm-test',
  standalone: true,
  imports: [PdfViewerComponent],
  template: `
    <div class="test-page">
      <header class="test-header">
        <h1>🔬 ng-pdf-renderer NPM Package Test</h1>
        <p class="subtitle">Testing with <strong>defaults only</strong> - no custom options</p>
        <p class="source">Using: Mozilla PDF.js sample document</p>
      </header>

      <div class="test-info">
        <h3>📋 What we're testing:</h3>
        <div class="info-grid">
          <div class="info-card">
            <h4>Default Settings</h4>
            <ul>
              <li>Height: 500px</li>
              <li>Width: 100%</li>
              <li>Controls: Hidden</li>
              <li>Auto-fit: Enabled</li>
              <li>Text selection: Enabled</li>
            </ul>
          </div>
          
          <div class="info-card">
            <h4>Test File</h4>
            <ul>
              <li>Source: Mozilla PDF.js</li>
              <li>Content: TraceMonkey paper</li>
              <li>Purpose: Verify basic rendering</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>🎯 PDF Viewer Test (Defaults Only)</h3>
        <div class="pdf-container">
          <!-- This is the ONLY line that matters - pure defaults! -->
          <ng-pdf-viewer [src]="pdfUrl"></ng-pdf-viewer>
        </div>
      </div>

      <div class="test-questions">
        <h3>❓ Questions to Answer:</h3>
        <div class="questions-grid">
          <div class="question-card">
            <h4>1. Visual Appearance</h4>
            <p>Does the PDF render cleanly with the default 500px height?</p>
            <div class="answer-space">Your observation: _______________</div>
          </div>
          
          <div class="question-card">
            <h4>2. Auto-fit Behavior</h4>
            <p>Does the PDF scale properly to fit the container width?</p>
            <div class="answer-space">Your observation: _______________</div>
          </div>
          
          <div class="question-card">
            <h4>3. Text Selection</h4>
            <p>Can you select and copy text from the PDF?</p>
            <div class="answer-space">Your observation: _______________</div>
          </div>
          
          <div class="question-card">
            <h4>4. Mobile Responsiveness</h4>
            <p>How does it look when you resize the browser window?</p>
            <div class="answer-space">Your observation: _______________</div>
          </div>
        </div>
      </div>

      <div class="test-checklist">
        <h3>✅ Success Criteria</h3>
        <p>Check off each item as you test:</p>
        <div class="checklist">
          <label><input type="checkbox"> PDF loads without errors</label>
          <label><input type="checkbox"> PDF appears at 500px height</label>
          <label><input type="checkbox"> PDF fits container width nicely</label>
          <label><input type="checkbox"> No control buttons are visible</label>
          <label><input type="checkbox"> Text can be selected</label>
          <label><input type="checkbox"> No console errors in dev tools</label>
          <label><input type="checkbox"> Looks good on mobile/tablet</label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .test-header {
      text-align: center;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    
    .test-header h1 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .subtitle {
      color: #666;
      font-size: 16px;
      margin: 5px 0;
    }
    
    .source {
      color: #888;
      font-size: 14px;
      font-style: italic;
    }
    
    .test-info {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    
    .info-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .info-card h4 {
      color: #495057;
      margin-bottom: 10px;
    }
    
    .info-card ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .info-card li {
      margin-bottom: 5px;
      color: #666;
    }
    
    .test-section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    
    .test-section h3 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    
    .pdf-container {
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 15px;
      background: #f8f9fa;
      min-height: 520px; /* Slightly more than default 500px to accommodate the PDF */
    }
    
    .test-questions {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    
    .questions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    
    .question-card {
      background: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }
    
    .question-card h4 {
      color: #1976D2;
      margin-bottom: 10px;
    }
    
    .question-card p {
      color: #555;
      margin-bottom: 15px;
    }
    
    .answer-space {
      background: white;
      padding: 10px;
      border-radius: 4px;
      border: 1px dashed #ccc;
      color: #999;
      font-style: italic;
    }
    
    .test-checklist {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 15px;
    }
    
    .checklist label {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .checklist label:hover {
      background: #e9ecef;
    }
    
    .checklist input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .info-grid,
      .questions-grid {
        grid-template-columns: 1fr;
      }
      
      .test-page {
        padding: 15px;
      }
    }
  `]
})
export class NpmTestComponent {
  // Using a known working PDF URL instead of local file for now
  pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
}

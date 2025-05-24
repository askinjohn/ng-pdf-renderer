import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Component for PDF controls (navigation, zoom, etc.)
 */
@Component({
  selector: 'ng-pdf-controls',
  standalone: true,  // Modern Angular standalone component
  imports: [CommonModule, FormsModule],  // Import dependencies
  template: `
    <div class="pdf-controls">
      <!-- Page navigation controls -->
      <div class="pdf-navigation" *ngIf="showNavigation">
        <button (click)="onFirstPage()" [disabled]="currentPage <= 1">First</button>
        <button (click)="onPreviousPage()" [disabled]="currentPage <= 1">Previous</button>
        <span class="page-info">
          <!-- Page input with two-way binding -->
          <input type="number" [ngModel]="currentPage" (ngModelChange)="onPageInputChange($event)" min="1" [max]="totalPages">
          / {{ totalPages }}
        </span>
        <button (click)="onNextPage()" [disabled]="currentPage >= totalPages">Next</button>
        <button (click)="onLastPage()" [disabled]="currentPage >= totalPages">Last</button>
      </div>
      
      <!-- Zoom controls -->
      <div class="pdf-zoom" *ngIf="showZoomControls">
        <button (click)="onZoomOut()">-</button>
        <span>{{ (zoom * 100).toFixed(0) }}%</span>
        <button (click)="onZoomIn()">+</button>
        <select [ngModel]="zoom" (ngModelChange)="onZoomSelect($event)">
          <option [value]="0.5">50%</option>
          <option [value]="0.75">75%</option>
          <option [value]="1">100%</option>
          <option [value]="1.25">125%</option>
          <option [value]="1.5">150%</option>
          <option [value]="2">200%</option>
        </select>
      </div>
      
      <!-- Rotation controls -->
      <div class="pdf-rotation" *ngIf="showRotationControls">
        <button (click)="onRotateLeft()">↺</button>
        <button (click)="onRotateRight()">↻</button>
      </div>
      
      <!-- Action buttons -->
      <div class="pdf-actions">
        <button *ngIf="showDownloadButton" (click)="onDownload()">Download</button>
        <button *ngIf="showPrintButton" (click)="onPrint()">Print</button>
      </div>
      
      <!-- Search functionality -->
      <div class="pdf-search" *ngIf="showSearchBar">
        <input type="text" placeholder="Search..." #searchInput>
        <button (click)="onSearch(searchInput.value)">Search</button>
      </div>
    </div>
  `,
  styles: [`
    /* Control bar container */
    .pdf-controls {
      display: flex;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    /* Control groups */
    .pdf-navigation, .pdf-zoom, .pdf-rotation, .pdf-actions, .pdf-search {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    /* Button styling */
    button {
      padding: 4px 8px;
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
    }
    
    button:hover {
      background: #e0e0e0;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Form control styling */
    input[type="number"], input[type="text"] {
      width: 50px;
      padding: 4px;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
    
    input[type="text"] {
      width: 150px;
    }
    
    select {
      padding: 4px;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
  `]
})
export class PdfControlsComponent {
  // Input properties for control configuration
  @Input() currentPage: number = 1;        // Current page being displayed
  @Input() totalPages: number = 0;         // Total pages in document
  @Input() zoom: number = 1;               // Current zoom level
  @Input() rotation: number = 0;           // Current rotation in degrees
  
  // Control visibility options
  @Input() showNavigation: boolean = true;        // Show page navigation
  @Input() showZoomControls: boolean = true;      // Show zoom controls
  @Input() showRotationControls: boolean = true;  // Show rotation controls
  @Input() showDownloadButton: boolean = true;    // Show download button
  @Input() showPrintButton: boolean = true;       // Show print button
  @Input() showSearchBar: boolean = true;         // Show search functionality
  @Input() showThumbnails: boolean = false;       // Show thumbnails panel
  @Input() showOutline: boolean = false;          // Show outline/bookmarks panel
  
  // Output events
  @Output() pageChange = new EventEmitter<number>();          // Page changed
  @Output() zoomChange = new EventEmitter<number>();          // Zoom changed
  @Output() rotationChange = new EventEmitter<number>();      // Rotation changed
  @Output() download = new EventEmitter<void>();              // Download requested
  @Output() print = new EventEmitter<void>();                 // Print requested
  @Output() search = new EventEmitter<string>();              // Search requested
  @Output() toggleThumbnails = new EventEmitter<boolean>();   // Toggle thumbnails
  @Output() toggleOutline = new EventEmitter<boolean>();      // Toggle outline
  
  /**
   * Navigate to first page
   */
  onFirstPage(): void {
    this.pageChange.emit(1);
  }
  
  /**
   * Navigate to previous page
   */
  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }
  
  /**
   * Navigate to next page
   */
  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
  
  /**
   * Navigate to last page
   */
  onLastPage(): void {
    this.pageChange.emit(this.totalPages);
  }
  
  /**
   * Handle direct page number input
   * @param page The new page number
   */
  onPageInputChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
  
  /**
   * Increase zoom by 20%
   */
  onZoomIn(): void {
    this.zoomChange.emit(this.zoom * 1.2);
  }
  
  /**
   * Decrease zoom by 20%
   */
  onZoomOut(): void {
    this.zoomChange.emit(this.zoom / 1.2);
  }
  
  /**
   * Handle zoom dropdown selection
   * @param zoom The selected zoom level
   */
  onZoomSelect(zoom: number): void {
    this.zoomChange.emit(parseFloat(zoom.toString()));
  }
  
  /**
   * Rotate counterclockwise by 90 degrees
   */
  onRotateLeft(): void {
    this.rotationChange.emit(-90);
  }
  
  /**
   * Rotate clockwise by 90 degrees
   */
  onRotateRight(): void {
    this.rotationChange.emit(90);
  }
  
  /**
   * Trigger document download
   */
  onDownload(): void {
    this.download.emit();
  }
  
  /**
   * Trigger document printing
   */
  onPrint(): void {
    this.print.emit();
  }
  
  /**
   * Execute search if text is provided
   * @param text The text to search for
   */
  onSearch(text: string): void {
    if (text.trim()) {
      this.search.emit(text);
    }
  }
}
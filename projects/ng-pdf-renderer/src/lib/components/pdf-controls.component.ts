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
      @if (showNavigation) { <div class="pdf-navigation">
        <button type="button" (click)="onFirstPage()" [disabled]="currentPage <= 1">First</button>
        <button type="button" (click)="onPreviousPage()" [disabled]="currentPage <= 1">Previous</button>
        <span class="page-info">
          <!-- Page input with two-way binding -->
          <input aria-label="Page number" type="number" [ngModel]="currentPage" (ngModelChange)="onPageInputChange($event)" min="1" [max]="totalPages">
          / {{ totalPages }}
        </span>
        <button type="button" (click)="onNextPage()" [disabled]="currentPage >= totalPages">Next</button>
        <button type="button" (click)="onLastPage()" [disabled]="currentPage >= totalPages">Last</button>
      </div> }
      
      <!-- Zoom controls -->
      @if (showZoomControls) { <div class="pdf-zoom">
        <button type="button" aria-label="Zoom out" (click)="onZoomOut()">-</button>
        <span>{{ (zoom * 100).toFixed(0) }}%</span>
        <button type="button" aria-label="Zoom in" (click)="onZoomIn()">+</button>
        <select aria-label="Zoom" [ngModel]="zoom" (ngModelChange)="onZoomSelect($event)">
          <option [value]="0.5">50%</option>
          <option [value]="0.75">75%</option>
          <option [value]="1">100%</option>
          <option [value]="1.25">125%</option>
          <option [value]="1.5">150%</option>
          <option [value]="2">200%</option>
        </select>
      </div> }
      
      <!-- Rotation controls -->
      @if (showRotationControls) { <div class="pdf-rotation">
        <button type="button" aria-label="Rotate left" (click)="onRotateLeft()">↺</button>
        <button type="button" aria-label="Rotate right" (click)="onRotateRight()">↻</button>
      </div> }
      
      <!-- Action buttons -->
      <div class="pdf-actions">
        @if (showDownloadButton) { <button type="button" (click)="onDownload()">Download</button> }
        @if (showPrintButton) { <button type="button" (click)="onPrint()">Print</button> }
      </div>
      
      <div class="pdf-panels">
        <button type="button" [attr.aria-pressed]="showThumbnails" (click)="toggleThumbnails.emit(!showThumbnails)">Thumbnails</button>
        <button type="button" [attr.aria-pressed]="showOutline" (click)="toggleOutline.emit(!showOutline)">Bookmarks</button>
      </div>
      <!-- Search functionality -->
      @if (showSearchBar) { <div class="pdf-search">
        <input aria-label="Search PDF" type="text" placeholder="Search document…" #searchInput (keydown.enter)="onSearch(searchInput.value)">
        <button type="button" (click)="onSearch(searchInput.value)">Search</button>
      </div> }
    </div>
  `,
  styles: [`
    :host { display:block; color:#1e293b; font:14px/1.4 system-ui, sans-serif; }
    .pdf-controls { display:flex; flex-wrap:wrap; gap:10px; padding:12px; background:#fff; border-bottom:1px solid #e2e8f0; }
    .pdf-navigation, .pdf-zoom, .pdf-rotation, .pdf-actions, .pdf-panels, .pdf-search { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .page-info { display:flex; align-items:center; gap:6px; white-space:nowrap; }
    button, input, select { box-sizing:border-box; min-height:36px; font:inherit; border:1px solid #cbd5e1; border-radius:6px; color:inherit; background:#fff; }
    button { padding:6px 10px; cursor:pointer; }
    button:hover:not(:disabled) { background:#f1f5f9; border-color:#94a3b8; }
    button[aria-pressed="true"] { background:#eff6ff; color:#1d4ed8; border-color:#93c5fd; }
    button:disabled { color:#64748b; background:#f8fafc; cursor:default; }
    input, select { padding:6px; }
    input[type="number"] { width:58px; }
    input[type="text"] { width:170px; max-width:100%; }
    button:focus-visible, input:focus-visible, select:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
    @media (max-width:600px) { .pdf-controls { padding:8px; gap:8px; } button { min-height:40px; } .pdf-search { width:100%; } .pdf-search input { flex:1; min-width:0; } }
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
    if (Number.isInteger(page) && page >= 1 && page <= this.totalPages) {
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
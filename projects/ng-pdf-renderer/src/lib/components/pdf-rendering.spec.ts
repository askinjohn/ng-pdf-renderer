import { beforeAll, describe, expect, it } from 'vitest';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as pdfjs from 'pdfjs-dist';
import { PdfService } from '../services/pdf.service';
import { PdfViewerComponent } from './pdf-viewer.component';

// A self-contained PDF exercises the real parser, canvas, and selectable text.
function samplePdf(): Uint8Array {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R /Annots [6 0 R] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = 'BT /F1 18 Tf 40 300 Td (Hello Angular PDF) Tj ET';
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objects.push('<< /Type /Annot /Subtype /Link /Rect [40 295 200 320] /A << /S /URI /URI (https://angular.dev/) >> >>');
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => pdf += `${String(offset).padStart(10, '0')} 00000 n \n`);
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

describe('Real PDF rendering', () => {
  beforeAll(async () => {
    // Run PDF.js's worker implementation locally, without a CDN dependency in tests.
    (globalThis as any).pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
  });

  it('loads binary input without detaching it and renders canvas plus selectable text', async () => {
    TestBed.configureTestingModule({ providers: [PdfService] });
    const service = TestBed.inject(PdfService);
    const input = samplePdf();
    const originalLength = input.length;
    const pdf = await service.loadDocument(input);
    expect(pdf.numPages).toBe(1);
    expect(input.length).toBe(originalLength);
    const fixture = TestBed.createComponent(PdfViewerComponent);
    const viewer = fixture.componentInstance;
    const localService = fixture.debugElement.injector.get(PdfService);
    await localService.loadDocument(input);
    viewer.canvasContainer = new ElementRef(document.createElement('div'));
    const page = document.createElement('div');
    page.className = 'pdf-page';
    page.style.position = 'relative';
    page.style.width = '300px';
    page.style.height = '400px';
    fixture.nativeElement.appendChild(page);
    await (viewer as any).renderPageContent(page, 1, 1);
    const canvas = page.querySelector('canvas')!;
    expect(canvas.width).toBeGreaterThan(0);
    expect(page.querySelector('.textLayer')?.textContent).toContain('Hello Angular PDF');
    const span = page.querySelector('.textLayer span')!;
    expect(parseFloat(getComputedStyle(span).fontSize)).toBeGreaterThan(0);
    expect(span.getBoundingClientRect().width).toBeGreaterThan(50);
    const link = page.querySelector('a')!;
    expect(link.href).toBe('https://angular.dev/');
    expect(link.rel).toContain('noopener');
    expect(getComputedStyle(link.parentElement!).zIndex).toBe('11');
    expect(getComputedStyle(link).pointerEvents).toBe('auto');

    viewer.rotation.set(90);
    page.style.width = '400px';
    page.style.height = '300px';
    await (viewer as any).renderPageContent(page, 1, 1);
    const rotatedText = page.querySelector('.textLayer span')!.getBoundingClientRect();
    const pageBounds = page.getBoundingClientRect();
    expect(rotatedText.left).toBeGreaterThanOrEqual(pageBounds.left);
    expect(rotatedText.right).toBeLessThanOrEqual(pageBounds.right);
    expect(rotatedText.top).toBeGreaterThanOrEqual(pageBounds.top);
    expect(rotatedText.bottom).toBeLessThanOrEqual(pageBounds.bottom);

    viewer.options = { renderTextLayer: false };
    await (viewer as any).renderPageContent(page, 1, 1);
    expect(page.querySelector('.textLayer')).toBeNull();
    fixture.destroy();
    await service.clearDocument();
  });
});

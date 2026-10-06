import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfService } from '../services/pdf.service';
import { formPdf, passwordPdf } from '../../testing/pdf-fixtures';

@Component({
  imports: [PdfViewerComponent],
  template: `<div style="display:flex;gap:8px">
    <ng-pdf-viewer style="flex:1;min-width:0" [src]="source" [options]="options" />
    <ng-pdf-viewer style="flex:1;min-width:0" [src]="source" [options]="options" />
  </div>`
})
class TwoViewers {
  source = formPdf();
  options = { height: '500px', autoFit: false, initialZoom: 0.7 };
}

async function createViewer(source: Uint8Array, panels = false) {
  const fixture = TestBed.createComponent(PdfViewerComponent);
  fixture.componentRef.setInput('src', source);
  fixture.componentRef.setInput('options', { autoFit: false, height: '800px', showControls: true, showThumbnails: panels, showOutline: panels });
  fixture.autoDetectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('PDF viewer features with real PDF fixtures', () => {
  beforeAll(async () => {
    (globalThis as any).pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
  });

  it('renders editable field types, preserves edits through rotation, and serializes them', async () => {
    const fixture = await createViewer(formPdf());
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelector('input[aria-label="Full name"]')).not.toBeNull(), { timeout: 10000 });
    const input = root.querySelector<HTMLInputElement>('input[aria-label="Full name"]')!;
    expect(input.value).toBe('Before');
    expect(input.getBoundingClientRect().width).toBeGreaterThan(100);
    input.value = 'Ada Lovelace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const checkbox = root.querySelector<HTMLInputElement>('input[aria-label="Agree"]')!;
    checkbox.click();
    expect(checkbox.checked).toBe(true);
    expect(root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Notes"]')?.value).toBe('Initial notes');
    expect(root.querySelector<HTMLInputElement>('input[aria-label="Read only"]')?.disabled).toBe(true);
    const country = root.querySelector<HTMLSelectElement>('select[aria-label="Country"]')!;
    country.value = 'US';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    const topics = root.querySelector<HTMLSelectElement>('select[aria-label="Topics"]')!;
    expect(topics.multiple).toBe(true);
    topics.options[0].selected = false;
    topics.options[1].selected = true;
    topics.options[2].selected = true;
    topics.dispatchEvent(new Event('input', { bubbles: true }));
    const radios = root.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios.length).toBe(2);
    radios[1].click();
    expect(radios[0].checked).toBe(false);

    const loadedDocument = fixture.componentInstance.pdfDocument();
    fixture.componentRef.setInput('options', { autoFit: false, height: '800px', showOutline: true });
    await fixture.whenStable();
    await vi.waitFor(() => expect(root.querySelector<HTMLInputElement>('input[aria-label="Full name"]')?.value).toBe('Ada Lovelace'), { timeout: 10000 });
    expect(fixture.componentInstance.pdfDocument()).toBe(loadedDocument);
    fixture.componentInstance.onRotationChange(90);
    await vi.waitFor(() => {
      const rotated = root.querySelector<HTMLInputElement>('input[aria-label="Full name"]');
      expect(rotated?.value).toBe('Ada Lovelace');
      const formLayer = root.querySelector('.pdf-form-layer');
      expect(formLayer?.getAttribute('data-main-rotation')).toBe('90');
    }, { timeout: 10000 });
    const fieldBounds = root.querySelector('input[aria-label="Full name"]')!.getBoundingClientRect();
    const pageBounds = root.querySelector('.pdf-page')!.getBoundingClientRect();
    expect(fieldBounds.left).toBeGreaterThanOrEqual(pageBounds.left);
    expect(fieldBounds.right).toBeLessThanOrEqual(pageBounds.right);

    const service = fixture.debugElement.injector.get(PdfService);
    const saved = await service.getDocumentData();
    const verifier = TestBed.inject(PdfService);
    const reloaded = await verifier.loadDocument(saved!);
    const fields = await reloaded.getFieldObjects();
    expect(fields.get('Full name')[0].value).toBe('Ada Lovelace');
    expect(fields.get('Agree')[0].value).toBe('Yes');
    expect(fields.get('Country')[0].value).toBe('US');
    const savedAnnotations = await (await reloaded.getPage(1)).getAnnotations();
    expect(savedAnnotations.find((annotation: any) => annotation.fieldName === 'Topics').fieldValue).toEqual(['B', 'C']);
    expect(fields.get('Plan').some((field: any) => field.value === 'Second')).toBe(true);
    fixture.destroy();
    await verifier.clearDocument();
  }, 20000);

  it('isolates fields and radio groups when two viewers display the same PDF', async () => {
    const host = TestBed.createComponent(TwoViewers);
    host.autoDetectChanges();
    await host.whenStable();
    const [first, second] = host.nativeElement.querySelectorAll('ng-pdf-viewer');
    await vi.waitFor(() => {
      expect(first.querySelectorAll('input[type="radio"]').length).toBe(2);
      expect(second.querySelectorAll('input[type="radio"]').length).toBe(2);
    }, { timeout: 10000 });
    const firstRadios = first.querySelectorAll('input[type="radio"]');
    const secondRadios = second.querySelectorAll('input[type="radio"]');
    firstRadios[1].click();
    expect(firstRadios[1].checked).toBe(true);
    expect(secondRadios[0].checked).toBe(true);
    const input = first.querySelector('input[aria-label="Full name"]');
    input.value = 'First viewer only';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(second.querySelector('input[aria-label="Full name"]').value).toBe('Before');
    host.destroy();
  }, 20000);

  it('renders nested bookmarks and lazy thumbnail navigation', async () => {
    const fixture = await createViewer(formPdf(), true);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => {
      expect(root.textContent).toContain('Details on page two');
      expect(root.querySelector('.thumbnail img')).not.toBeNull();
    }, { timeout: 10000 });
    const preview = root.querySelector<HTMLImageElement>('.thumbnail img')!;
    await preview.decode();
    const canvas = document.createElement('canvas');
    canvas.width = preview.naturalWidth;
    canvas.height = preview.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(preview, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 200 || pixels[i + 1] < 200 || pixels[i + 2] < 200) ++ink;
    expect(ink).toBeGreaterThan(300);
    fixture.componentInstance.outlineVisible.set(false);
    await fixture.whenStable();
    await vi.waitFor(() => expect(root.querySelector('.thumbnail img')).not.toBeNull(), { timeout: 10000 });
    fixture.componentInstance.outlineVisible.set(true);
    await fixture.whenStable();
    await vi.waitFor(() => expect(root.querySelector('.thumbnail img')).not.toBeNull(), { timeout: 10000 });
    const beforeEdit = root.querySelector<HTMLImageElement>('.thumbnail img')!.src;
    await vi.waitFor(() => expect(root.querySelector('input[aria-label="Full name"]')).not.toBeNull(), { timeout: 10000 });
    const name = root.querySelector<HTMLInputElement>('input[aria-label="Full name"]')!;
    name.value = 'A changed preview';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => {
      const image = root.querySelector<HTMLImageElement>('.thumbnail img');
      expect(image).not.toBeNull();
      expect(image!.src).not.toBe(beforeEdit);
    }, { timeout: 10000 });
    const bookmark = Array.from(root.querySelectorAll<HTMLButtonElement>('.outline button')).find(button => button.textContent?.includes('Details on page two'))!;
    bookmark.click();
    await vi.waitFor(() => expect(fixture.componentInstance.currentPage()).toBe(2));
    const thumbnail = root.querySelector<HTMLButtonElement>('.thumbnail[data-page-number="1"]')!;
    thumbnail.click();
    await vi.waitFor(() => expect(fixture.componentInstance.currentPage()).toBe(1));
    expect(root.querySelectorAll('.thumbnail').length).toBe(2);
    fixture.destroy();
  }, 20000);

  it('retries incorrect passwords and clears password inputs after submission', async () => {
    const fixture = await createViewer(passwordPdf());
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelector('.password-dialog')).not.toBeNull(), { timeout: 10000 });
    expect(root.querySelector('.pdf-body')?.hasAttribute('inert')).toBe(true);
    const input = root.querySelector<HTMLInputElement>('input[type="password"]')!;
    input.value = 'incorrect';
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(input.value).toBe('');
    await vi.waitFor(() => expect(root.textContent).toContain('Incorrect password'), { timeout: 10000 });
    const retry = root.querySelector<HTMLInputElement>('input[type="password"]')!;
    retry.value = 'viewer-test';
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(fixture.componentInstance.totalPages()).toBe(2);
      expect(root.querySelector('.password-dialog')).toBeNull();
      expect(fixture.componentInstance.loading()).toBe(false);
    }, { timeout: 10000 });
    fixture.destroy();
  }, 20000);

  it('cancels an encrypted load and can subsequently load another document', async () => {
    const fixture = await createViewer(passwordPdf());
    await vi.waitFor(() => expect(fixture.componentInstance.passwordRequest()).not.toBeNull(), { timeout: 10000 });
    await fixture.componentInstance.cancelPassword();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toContain('cancelled');
    fixture.componentRef.setInput('src', formPdf());
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.totalPages()).toBe(2), { timeout: 10000 });
    expect(fixture.componentInstance.passwordRequest()).toBeNull();
    fixture.destroy();
  }, 20000);

  it('suppresses widget controls when forms are disabled', async () => {
    const fixture = TestBed.createComponent(PdfViewerComponent);
    fixture.componentRef.setInput('src', formPdf());
    fixture.componentRef.setInput('options', { autoFit: false, renderForms: false });
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('.pdf-page canvas')).not.toBeNull(), { timeout: 10000 });
    expect(fixture.nativeElement.querySelector('.pdf-form-layer')).toBeNull();
    fixture.destroy();
  });
  it('does not render the previous PDF while awaiting a new document password', async () => {
    const fixture = await createViewer(formPdf());
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('input[aria-label="Full name"]')).not.toBeNull(), { timeout: 10000 });
    fixture.componentInstance.onZoomChange(1.5);
    fixture.componentRef.setInput('src', passwordPdf());
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.passwordRequest()).not.toBeNull(), { timeout: 10000 });
    expect(fixture.nativeElement.querySelector('.pdf-page')).toBeNull();
    await fixture.componentInstance.cancelPassword();
    fixture.destroy();
  }, 20000);

});

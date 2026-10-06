import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PdfService] });
    service = TestBed.inject(PdfService);
  });

  it('rejects fractional pages and pages outside the document', () => {
    (service as any).totalPagesSubject.next(5);
    const pages: number[] = [];
    service.currentPage$.subscribe(page => pages.push(page));
    service.setCurrentPage(2.5);
    service.setCurrentPage(6);
    service.setCurrentPage(0);
    service.setCurrentPage(3);
    expect(pages).toEqual([1, 3]);
  });

  it('rejects invalid zoom and clamps valid zoom to safe bounds', () => {
    const zooms: number[] = [];
    service.zoom$.subscribe(zoom => zooms.push(zoom));
    service.setZoom(NaN);
    service.setZoom(Infinity);
    service.setZoom(-1);
    service.setZoom(100);
    service.setZoom(0.01);
    expect(zooms).toEqual([1, 5, 0.1]);
  });

  it('allows only quarter-turn rotations', () => {
    const rotations: number[] = [];
    service.rotation$.subscribe(rotation => rotations.push(rotation));
    service.rotate(45);
    service.rotate(NaN);
    service.rotate(-90);
    expect(rotations).toEqual([0, 270]);
  });

  it('resolves named destinations and object references through PDF.js', async () => {
    const document = {
      getDestination: vi.fn().mockResolvedValue([{ num: 99, gen: 0 }, { name: 'Fit' }]),
      getPageIndex: vi.fn().mockResolvedValue(2)
    };
    (service as any).totalPagesSubject.next(5);
    const viewer = { scrollPageIntoView: vi.fn() };
    service.getLinkService().setDocument(document);
    service.getLinkService().setViewer(viewer);
    await service.getLinkService().navigateTo('chapter');
    expect(document.getPageIndex).toHaveBeenCalledWith({ num: 99, gen: 0 });
    expect(viewer.scrollPageIntoView).toHaveBeenCalledWith({ pageNumber: 3 });
  });

  it('normalizes a missing outline to an empty list', async () => {
    (service as any).pdfDocumentSubject.next({ getOutline: () => Promise.resolve(null) });
    expect(await service.getOutline()).toEqual([]);
  });

  it('ignores marked-content items during search', async () => {
    (service as any).pdfDocumentSubject.next({ numPages: 1, getPage: async () => ({
      getTextContent: async () => ({ items: [{ type: 'beginMarkedContent' }, { str: 'Hello world' }] })
    }) });
    expect((await service.search('hello')).length).toBe(1);
    expect(await service.search(' ')).toEqual([]);
  });
  it('does not insert a print iframe when PDF data cannot be obtained', async () => {
    (service as any).pdfDocumentSubject.next({ getData: async () => { throw new Error('data unavailable'); } });
    const framesBefore = document.querySelectorAll('iframe').length;
    await expect(service.printPdf()).rejects.toThrow('data unavailable');
    expect(document.querySelectorAll('iframe').length).toBe(framesBefore);
  });

});

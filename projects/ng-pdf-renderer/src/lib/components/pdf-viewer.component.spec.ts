import { vi } from 'vitest';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfService } from '../services/pdf.service';

describe('PdfViewerComponent', () => {
  let viewer: PdfViewerComponent;
  let service: PdfService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PdfService] });
    service = TestBed.inject(PdfService);
    viewer = TestBed.runInInjectionContext(() => new PdfViewerComponent());
    viewer.canvasContainer = new ElementRef(document.createElement('div'));
  });
  afterEach(() => viewer.ngOnDestroy());

  it('gives each viewer its own PDF service', () => {
    const first = TestBed.createComponent(PdfViewerComponent);
    const second = TestBed.createComponent(PdfViewerComponent);
    expect(first.debugElement.injector.get(PdfService)).not.toBe(second.debugElement.injector.get(PdfService));
    first.destroy();
    second.destroy();
  });

  it('keeps manual zoom when auto-fit is enabled', () => {
    viewer.onZoomChange(1.5);
    expect((viewer as any).autoFit).toBe(false);
    let zoom = 0;
    service.zoom$.subscribe(value => zoom = value);
    expect(zoom).toBe(1.5);
  });

  it('ignores stale source loads when the source changes rapidly', async () => {
    let resolveFirst!: (value: any) => void;
    const first = new Promise(resolve => resolveFirst = resolve);
    vi.spyOn(service, 'loadDocument').mockReturnValueOnce(first).mockResolvedValueOnce({ numPages: 2 });
    vi.spyOn(viewer as any, 'renderAllPages').mockResolvedValue(undefined);
    const emit = vi.spyOn(viewer.documentLoaded, 'emit');
    viewer.src = 'first.pdf';
    const oldLoad = (viewer as any).loadDocument();
    viewer.src = 'second.pdf';
    await (viewer as any).loadDocument();
    resolveFirst({ numPages: 9 });
    await oldLoad;
    expect(viewer.totalPages()).toBe(2);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('disconnects observers and cancels every pending render on destruction', () => {
    const observer = { disconnect: vi.fn() };
    const first = { cancel: vi.fn() };
    const second = { cancel: vi.fn() };
    (viewer as any).observers = [observer];
    (viewer as any).renderTasks = new Set([first, second]);
    viewer.ngOnDestroy();
    expect(observer.disconnect).toHaveBeenCalled();
    expect(first.cancel).toHaveBeenCalled();
    expect(second.cancel).toHaveBeenCalled();
  });
  it('ignores stale search results after a newer search', async () => {
    let resolveFirst!: (value: any[]) => void;
    const first = new Promise<any[]>(resolve => resolveFirst = resolve);
    vi.spyOn(service, 'search').mockReturnValueOnce(first).mockResolvedValueOnce([{ pageNumber: 2 }]);
    const navigate = vi.spyOn(viewer, 'onPageChange');
    const oldSearch = viewer.onSearch('old');
    await viewer.onSearch('new');
    resolveFirst([{ pageNumber: 1 }]);
    await oldSearch;
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(2);
  });

});

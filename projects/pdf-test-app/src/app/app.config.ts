import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NgPdfRendererConfigService } from 'ng-pdf-renderer';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      inject(NgPdfRendererConfigService).setConfig({ workerSrc: '/assets/pdfjs/pdf.worker.mjs' });
    })
  ]
};
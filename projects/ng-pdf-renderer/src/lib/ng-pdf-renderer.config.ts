import { Injectable } from '@angular/core';

/**
 * Configuration options for NgPdfRenderer
 */
export interface NgPdfRendererConfig {
  /**
   * Custom worker URL (optional, automatically detected if not provided)
   */
  workerSrc?: string;
}

/**
 * Service for global configuration of NgPdfRenderer
 * Allows application-wide settings to be applied
 */
@Injectable({
  providedIn: 'root'
})
export class NgPdfRendererConfigService {
  private _config: NgPdfRendererConfig = {};

  /**
   * Get the current configuration
   */
  get config(): NgPdfRendererConfig {
    return this._config;
  }

  /**
   * Set the configuration for NgPdfRenderer
   * @param config Configuration options
   */
  setConfig(config: NgPdfRendererConfig): void {
    this._config = { ...this._config, ...config };
  }
}
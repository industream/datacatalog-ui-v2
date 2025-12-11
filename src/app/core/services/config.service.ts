import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  DATACATALOG_API_URL: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: AppConfig | null = null;
  private configLoaded = false;
  private loadPromise: Promise<void> | null = null;

  get apiUrl(): string {
    const url = this.config?.DATACATALOG_API_URL || environment.apiUrl;
    return url;
  }

  get isLoaded(): boolean {
    return this.configLoaded;
  }

  async loadConfig(): Promise<void> {
    // Prevent multiple loads
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.doLoadConfig();
    return this.loadPromise;
  }

  async waitForConfig(): Promise<void> {
    if (this.configLoaded) return;
    if (this.loadPromise) {
      await this.loadPromise;
    }
  }

  private async doLoadConfig(): Promise<void> {
    // Always try to load config.json for runtime configuration
    // This allows Docker environment variables to override build-time settings
    try {
      const response = await fetch('/config.json');
      if (response.ok) {
        this.config = await response.json();
        console.log('[ConfigService] Loaded config:', this.config);
      } else {
        console.warn('[ConfigService] config.json not found, using environment defaults');
      }
    } catch (error) {
      console.warn('[ConfigService] Failed to load config.json:', error);
    } finally {
      this.configLoaded = true;
    }
  }
}

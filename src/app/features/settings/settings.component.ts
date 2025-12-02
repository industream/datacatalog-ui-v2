import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="settings-container">
      <header class="page-header">
        <h1>Settings</h1>
        <p class="subtitle">Configure your DataCatalog preferences</p>
      </header>

      <div class="settings-grid">
        <!-- Appearance Section -->
        <section class="settings-section">
          <h2>
            <span class="material-symbols-outlined">palette</span>
            Appearance
          </h2>

          <div class="setting-item">
            <div class="setting-info">
              <label>Theme</label>
              <p>Choose between light and dark mode</p>
            </div>
            <cds-toggle
              [checked]="isDarkTheme()"
              (cds-toggle)="toggleTheme()"
              label-text=""
              hide-label>
            </cds-toggle>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Density</label>
              <p>Adjust the spacing of UI elements</p>
            </div>
            <div class="density-options">
              @for (option of densityOptions; track option.value) {
                <button
                  class="density-btn"
                  [class.active]="density() === option.value"
                  (click)="setDensity(option.value)">
                  {{ option.label }}
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Preferences Section -->
        <section class="settings-section">
          <h2>
            <span class="material-symbols-outlined">tune</span>
            Preferences
          </h2>

          <div class="setting-item">
            <div class="setting-info">
              <label>Default View</label>
              <p>Choose the default view mode for Explorer</p>
            </div>
            <select class="form-select" [value]="defaultView()" (change)="setDefaultView($event)">
              <option value="table">Table</option>
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Items per Page</label>
              <p>Number of items to display per page</p>
            </div>
            <select class="form-select" [value]="itemsPerPage()" (change)="setItemsPerPage($event)">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </section>

        <!-- API Section -->
        <section class="settings-section">
          <h2>
            <span class="material-symbols-outlined">api</span>
            API Configuration
          </h2>

          <div class="setting-item api-endpoint-item">
            <div class="setting-info">
              <label>API Endpoint</label>
              <p>DataCatalog API URL</p>
            </div>
            <div class="api-input-group">
              <input
                type="text"
                class="form-input api-input"
                [value]="apiUrl()"
                (input)="onApiUrlChange($event)"
                placeholder="http://localhost:8002">
              <button
                class="test-btn"
                [class.testing]="isTesting()"
                [disabled]="isTesting()"
                (click)="testConnection()">
                @if (isTesting()) {
                  <span class="material-symbols-outlined animate-spin">sync</span>
                } @else {
                  <span class="material-symbols-outlined">play_arrow</span>
                }
                {{ isTesting() ? 'Testing...' : 'Test' }}
              </button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Connection Status</label>
              <p>API health check status</p>
            </div>
            <div class="status-indicator" [class]="apiStatus()">
              <span class="status-dot"></span>
              {{ apiStatus() === 'connected' ? 'Connected' : apiStatus() === 'disconnected' ? 'Disconnected' : 'Not tested' }}
            </div>
          </div>
        </section>

        <!-- About Section -->
        <section class="settings-section">
          <h2>
            <span class="material-symbols-outlined">info</span>
            About
          </h2>

          <div class="about-info">
            <div class="version">
              <strong>DataCatalog UI</strong>
              <span>Version 2.0.0</span>
            </div>
            <p>Enterprise Data Catalog Management Interface</p>
            <p class="copyright">© 2025 Industream</p>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: var(--dc-space-xl);
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--dc-space-xl);

      h1 {
        margin: 0 0 var(--dc-space-xs);
        font-size: 2rem;
        font-weight: 600;
      }

      .subtitle {
        margin: 0;
        color: var(--dc-text-secondary);
      }
    }

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-xl);
    }

    .settings-section {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      padding: var(--dc-space-lg);

      h2 {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
        margin: 0 0 var(--dc-space-lg);
        font-size: 1.125rem;
        font-weight: 600;
        padding-bottom: var(--dc-space-md);
        border-bottom: 1px solid var(--dc-border-subtle);

        .material-symbols-outlined {
          font-size: 20px;
          color: var(--dc-primary);
        }
      }
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-md) 0;
      border-bottom: 1px solid var(--dc-border-subtle);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
    }

    .setting-info {
      label {
        display: block;
        font-weight: 500;
        margin-bottom: var(--dc-space-xs);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--dc-text-secondary);
      }
    }

    .density-options {
      display: flex;
      gap: 2px;
      background: var(--dc-bg-tertiary);
      padding: 2px;
      border-radius: var(--dc-radius-sm);
    }

    .density-btn {
      padding: var(--dc-space-sm) var(--dc-space-md);
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: var(--dc-radius-sm);
      font-size: 0.875rem;
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--dc-primary);
        color: white;
      }
    }

    /* Form select styling */
    .form-select {
      padding: var(--dc-space-sm) var(--dc-space-md);
      padding-right: 2rem;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;
      cursor: pointer;
      min-width: 120px;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='%23c6c6c6'%3E%3Cpath d='M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      &:hover {
        border-color: var(--dc-border-strong);
      }

      option {
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
      }
    }

    .api-url {
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      font-family: monospace;
      font-size: 0.875rem;
    }

    .api-endpoint-item {
      flex-wrap: wrap;
      gap: var(--dc-space-md);
    }

    .api-input-group {
      display: flex;
      gap: var(--dc-space-sm);
      align-items: center;
    }

    .api-input {
      width: 280px;
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-family: monospace;
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }
    }

    .test-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--dc-space-xs);
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-primary);
      border: none;
      border-radius: var(--dc-radius-sm);
      color: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--dc-duration-fast);
      white-space: nowrap;

      .material-symbols-outlined {
        font-size: 18px;
      }

      &:hover:not(:disabled) {
        background: var(--dc-primary-hover);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      &.testing {
        background: var(--dc-bg-tertiary);
        color: var(--dc-text-secondary);
      }
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      font-size: 0.875rem;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      &.connected {
        color: var(--dc-success);
        .status-dot { background: var(--dc-success); }
      }

      &.disconnected {
        color: var(--dc-error);
        .status-dot { background: var(--dc-error); }
      }

      &.unknown {
        color: var(--dc-text-secondary);
        .status-dot { background: var(--dc-text-secondary); }
      }
    }

    .about-info {
      text-align: center;
      padding: var(--dc-space-lg);

      .version {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--dc-space-md);
        margin-bottom: var(--dc-space-md);

        strong {
          font-size: 1.125rem;
        }

        span {
          padding: var(--dc-space-xs) var(--dc-space-sm);
          background: var(--dc-bg-tertiary);
          border-radius: var(--dc-radius-sm);
          font-size: 0.875rem;
        }
      }

      p {
        margin: 0;
        color: var(--dc-text-secondary);
      }

      .copyright {
        margin-top: var(--dc-space-md);
        font-size: 0.75rem;
      }
    }
  `]
})
export class SettingsComponent {
  readonly densityOptions = [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
    { value: 'comfortable', label: 'Comfortable' }
  ];

  readonly isDarkTheme = signal(true);
  readonly density = signal('compact');
  readonly defaultView = signal('table');
  readonly itemsPerPage = signal('50');
  readonly apiUrl = signal('http://localhost:8002');
  readonly apiStatus = signal<'connected' | 'disconnected' | 'unknown'>('unknown');
  readonly isTesting = signal(false);

  constructor() {
    this.loadPreferences();
    // Test connection on load
    this.testConnection();
  }

  toggleTheme(): void {
    this.isDarkTheme.update(dark => !dark);
    this.applyTheme();
    this.savePreferences();
  }

  setDensity(value: string): void {
    this.density.set(value);
    this.applyDensity();
    this.savePreferences();
  }

  setDefaultView(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.defaultView.set(select.value);
    this.savePreferences();
  }

  setItemsPerPage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itemsPerPage.set(select.value);
    this.savePreferences();
  }

  onApiUrlChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.apiUrl.set(input.value);
    this.apiStatus.set('unknown');
    localStorage.setItem('dc-api-url', input.value);
  }

  async testConnection(): Promise<void> {
    const url = this.apiUrl();
    if (!url) {
      this.apiStatus.set('disconnected');
      return;
    }

    this.isTesting.set(true);

    try {
      // Try to reach the API health endpoint
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        this.apiStatus.set('connected');
      } else {
        this.apiStatus.set('disconnected');
      }
    } catch {
      // If health endpoint fails, try the base URL
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        this.apiStatus.set(response.ok ? 'connected' : 'disconnected');
      } catch {
        this.apiStatus.set('disconnected');
      }
    } finally {
      this.isTesting.set(false);
    }
  }

  private loadPreferences(): void {
    const theme = localStorage.getItem('dc-theme');
    const density = localStorage.getItem('dc-density');
    const defaultView = localStorage.getItem('dc-default-view');
    const itemsPerPage = localStorage.getItem('dc-items-per-page');
    const apiUrl = localStorage.getItem('dc-api-url');

    if (theme) this.isDarkTheme.set(theme === 'dark');
    if (density) this.density.set(density);
    if (defaultView) this.defaultView.set(defaultView);
    if (itemsPerPage) this.itemsPerPage.set(itemsPerPage);
    if (apiUrl) this.apiUrl.set(apiUrl);

    this.applyTheme();
    this.applyDensity();
  }

  private savePreferences(): void {
    localStorage.setItem('dc-theme', this.isDarkTheme() ? 'dark' : 'light');
    localStorage.setItem('dc-density', this.density());
    localStorage.setItem('dc-default-view', this.defaultView());
    localStorage.setItem('dc-items-per-page', this.itemsPerPage());
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkTheme() ? 'dark' : 'light');
  }

  private applyDensity(): void {
    document.documentElement.setAttribute('data-density', this.density());
  }
}

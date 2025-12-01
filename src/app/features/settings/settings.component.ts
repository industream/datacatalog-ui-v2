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
            <cds-dropdown value="grid">
              <cds-dropdown-item value="list">List</cds-dropdown-item>
              <cds-dropdown-item value="grid">Grid</cds-dropdown-item>
              <cds-dropdown-item value="table">Table</cds-dropdown-item>
            </cds-dropdown>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Items per Page</label>
              <p>Number of items to display per page</p>
            </div>
            <cds-dropdown value="50">
              <cds-dropdown-item value="25">25</cds-dropdown-item>
              <cds-dropdown-item value="50">50</cds-dropdown-item>
              <cds-dropdown-item value="100">100</cds-dropdown-item>
            </cds-dropdown>
          </div>
        </section>

        <!-- API Section -->
        <section class="settings-section">
          <h2>
            <span class="material-symbols-outlined">api</span>
            API Configuration
          </h2>

          <div class="setting-item">
            <div class="setting-info">
              <label>API Endpoint</label>
              <p>Current DataCatalog API URL</p>
            </div>
            <code class="api-url">{{ apiUrl() }}</code>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Connection Status</label>
              <p>API health check status</p>
            </div>
            <div class="status-indicator" [class]="apiStatus()">
              <span class="status-dot"></span>
              {{ apiStatus() === 'connected' ? 'Connected' : 'Disconnected' }}
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

    .api-url {
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      font-family: monospace;
      font-size: 0.875rem;
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
  readonly density = signal('default');
  readonly apiUrl = signal('http://localhost:8002');
  readonly apiStatus = signal<'connected' | 'disconnected'>('connected');

  constructor() {
    this.loadPreferences();
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

  private loadPreferences(): void {
    const theme = localStorage.getItem('dc-theme');
    const density = localStorage.getItem('dc-density');

    if (theme) this.isDarkTheme.set(theme === 'dark');
    if (density) this.density.set(density);

    this.applyTheme();
    this.applyDensity();
  }

  private savePreferences(): void {
    localStorage.setItem('dc-theme', this.isDarkTheme() ? 'dark' : 'light');
    localStorage.setItem('dc-density', this.density());
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkTheme() ? 'dark' : 'light');
  }

  private applyDensity(): void {
    document.documentElement.setAttribute('data-density', this.density());
  }
}

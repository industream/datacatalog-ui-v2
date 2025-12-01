import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-sources',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="sources-container">
      <header class="page-header">
        <h1>Source Connections</h1>
        <p class="subtitle">Manage your data source connections</p>
      </header>

      <div class="placeholder">
        <span class="material-symbols-outlined placeholder-icon">cable</span>
        <h2>Source Connections</h2>
        <p>Manage connections to PostgreSQL, InfluxDB, MQTT, OPC-UA, and more.</p>
        <p class="coming-soon">Full implementation coming in Phase 5</p>
      </div>
    </div>
  `,
  styles: [`
    .sources-container {
      padding: var(--dc-space-xl);
      max-width: 1400px;
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

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-2xl);
      text-align: center;
      background: var(--dc-bg-secondary);
      border: 2px dashed var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);

      .placeholder-icon {
        font-size: 64px;
        color: var(--dc-text-secondary);
        margin-bottom: var(--dc-space-lg);
      }

      h2 {
        margin: 0 0 var(--dc-space-sm);
      }

      p {
        margin: 0;
        color: var(--dc-text-secondary);
      }

      .coming-soon {
        margin-top: var(--dc-space-md);
        font-style: italic;
        opacity: 0.7;
      }
    }
  `]
})
export class SourcesComponent {}

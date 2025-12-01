import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/tile/index.js';

import { CatalogStore } from '../../store';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  link: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Overview of your data catalog</p>
      </header>

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading data...</p>
        </div>
      } @else {
        <!-- Stats Grid -->
        <section class="stats-grid">
          @for (stat of stats(); track stat.label) {
            <a [routerLink]="stat.link" class="stat-card" [style.--accent-color]="stat.color">
              <div class="stat-icon">
                <span class="material-symbols-outlined">{{ stat.icon }}</span>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ stat.value | number }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </a>
          }
        </section>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Distribution Chart -->
          <section class="chart-section">
            <h2>Entries by Source Type</h2>
            <div class="chart-container">
              @if (store.entriesBySourceType().length === 0) {
                <p class="empty-state">No entries yet</p>
              } @else {
                @for (item of store.entriesBySourceType(); track item.type) {
                  <div class="distribution-item">
                    <div class="distribution-bar" [style.width.%]="item.percentage" [style.background]="item.color"></div>
                    <div class="distribution-info">
                      <span class="distribution-label">{{ item.type }}</span>
                      <span class="distribution-value">{{ item.count }} ({{ item.percentage }}%)</span>
                    </div>
                  </div>
                }
              }
            </div>
          </section>

          <!-- Source Connections -->
          <section class="sources-section">
            <h2>Source Connections</h2>
            <div class="sources-list">
              @if (store.sourceConnections().length === 0) {
                <p class="empty-state">No source connections configured</p>
              } @else {
                @for (source of store.sourceConnections().slice(0, 5); track source.id) {
                  <div class="source-item">
                    <span class="source-type-badge" [style.background]="getSourceColor(source.sourceType?.name)">
                      {{ source.sourceType?.name || 'Unknown' }}
                    </span>
                    <span class="source-name">{{ source.name }}</span>
                  </div>
                }
                @if (store.sourceConnections().length > 5) {
                  <a routerLink="/sources" class="view-all-link">
                    View all {{ store.sourceConnections().length }} connections
                  </a>
                }
              }
            </div>
          </section>
        </div>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <cds-button kind="primary" routerLink="/explorer">
              <span class="material-symbols-outlined" slot="icon">add</span>
              New Entry
            </cds-button>
            <cds-button kind="secondary" routerLink="/sources">
              <span class="material-symbols-outlined" slot="icon">cable</span>
              New Source
            </cds-button>
            <cds-button kind="tertiary" (click)="onImportCSV()">
              <span class="material-symbols-outlined" slot="icon">upload</span>
              Import CSV
            </cds-button>
            <cds-button kind="ghost" (click)="onExportAll()">
              <span class="material-symbols-outlined" slot="icon">download</span>
              Export All
            </cds-button>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: var(--dc-space-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: var(--dc-space-xl);

      h1 {
        margin: 0 0 var(--dc-space-xs);
        font-size: 2rem;
        font-weight: 600;
        color: var(--dc-text-primary);
      }

      .subtitle {
        margin: 0;
        color: var(--dc-text-secondary);
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-2xl);
      color: var(--dc-text-secondary);

      .material-symbols-outlined {
        font-size: 48px;
        margin-bottom: var(--dc-space-md);
      }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--dc-space-lg);
      margin-bottom: var(--dc-space-xl);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      padding: var(--dc-space-lg);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      text-decoration: none;
      color: inherit;
      transition: all var(--dc-duration-fast) var(--dc-easing-standard);

      &:hover {
        border-color: var(--accent-color, var(--dc-primary));
        box-shadow: var(--dc-shadow-md);
        transform: translateY(-2px);
      }
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: color-mix(in srgb, var(--accent-color) 15%, transparent);
      border-radius: var(--dc-radius-md);
      color: var(--accent-color);

      .material-symbols-outlined {
        font-size: 24px;
      }
    }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--dc-text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--dc-text-secondary);
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dc-space-xl);
      margin-bottom: var(--dc-space-xl);

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-section,
    .sources-section {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      padding: var(--dc-space-lg);

      h2 {
        margin: 0 0 var(--dc-space-lg);
        font-size: 1.125rem;
        font-weight: 600;
      }
    }

    .empty-state {
      color: var(--dc-text-secondary);
      font-style: italic;
      text-align: center;
      padding: var(--dc-space-lg);
    }

    /* Distribution Chart */
    .chart-container {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-md);
    }

    .distribution-item {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-xs);
    }

    .distribution-bar {
      height: 8px;
      border-radius: var(--dc-radius-full);
      transition: width var(--dc-duration-slow) var(--dc-easing-standard);
      min-width: 4px;
    }

    .distribution-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .distribution-label {
      color: var(--dc-text-primary);
    }

    .distribution-value {
      color: var(--dc-text-secondary);
    }

    /* Sources List */
    .sources-list {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-sm);
    }

    .source-item {
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      padding: var(--dc-space-sm);
      border-radius: var(--dc-radius-sm);
      transition: background var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-tertiary);
      }
    }

    .source-type-badge {
      padding: 2px 8px;
      border-radius: var(--dc-radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .source-name {
      color: var(--dc-text-primary);
      font-size: 0.875rem;
    }

    .view-all-link {
      display: block;
      text-align: center;
      padding: var(--dc-space-sm);
      color: var(--dc-primary);
      text-decoration: none;
      font-size: 0.875rem;

      &:hover {
        text-decoration: underline;
      }
    }

    /* Quick Actions */
    .quick-actions {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      padding: var(--dc-space-lg);

      h2 {
        margin: 0 0 var(--dc-space-lg);
        font-size: 1.125rem;
        font-weight: 600;
      }
    }

    .actions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dc-space-md);
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly store = inject(CatalogStore);

  private readonly sourceTypeColors: Record<string, string> = {
    'DataBridge': 'var(--dc-source-databridge)',
    'PostgreSQL': 'var(--dc-source-postgresql)',
    'InfluxDB2': 'var(--dc-source-influxdb)',
    'MQTT': 'var(--dc-source-mqtt)',
    'S3': 'var(--dc-source-s3)',
    'Email': 'var(--dc-source-email)',
    'Http': 'var(--dc-source-http)',
    'OPC-UA': 'var(--dc-source-opcua)',
    'Modbus-TCP': 'var(--dc-source-modbus)',
    'Leneda': 'var(--dc-source-leneda)'
  };

  readonly stats = computed<StatCard[]>(() => [
    {
      label: 'Catalog Entries',
      value: this.store.totalEntries(),
      icon: 'folder_open',
      color: '#0f62fe',
      link: '/explorer'
    },
    {
      label: 'Source Connections',
      value: this.store.totalSources(),
      icon: 'cable',
      color: '#24a148',
      link: '/sources'
    },
    {
      label: 'Labels',
      value: this.store.totalLabels(),
      icon: 'label',
      color: '#8a3ffc',
      link: '/labels'
    },
    {
      label: 'Source Types',
      value: this.store.totalSourceTypes(),
      icon: 'category',
      color: '#d02670',
      link: '/sources'
    }
  ]);

  ngOnInit(): void {
    this.store.loadAll();
  }

  getSourceColor(type: string | undefined): string {
    return this.sourceTypeColors[type || ''] || 'var(--dc-border-strong)';
  }

  onImportCSV(): void {
    // TODO: Open import modal
    console.log('Import CSV clicked');
  }

  onExportAll(): void {
    // TODO: Trigger export
    console.log('Export all clicked');
  }
}

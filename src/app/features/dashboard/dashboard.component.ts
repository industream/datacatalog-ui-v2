import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/tile/index.js';

interface StatCard {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  icon: string;
  color: string;
  link: string;
}

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'import';
  entityType: 'entry' | 'source' | 'label';
  entityName: string;
  timestamp: Date;
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
            <div class="stat-trend" [class]="stat.trend">
              <span class="material-symbols-outlined trend-icon">
                {{ stat.trend === 'up' ? 'trending_up' : stat.trend === 'down' ? 'trending_down' : 'trending_flat' }}
              </span>
              <span class="trend-value">
                {{ stat.trend === 'stable' ? '—' : (stat.trend === 'up' ? '+' : '') + stat.trendValue }}
              </span>
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
            @for (item of distribution(); track item.type) {
              <div class="distribution-item">
                <div class="distribution-bar" [style.width.%]="item.percentage" [style.background]="item.color"></div>
                <div class="distribution-info">
                  <span class="distribution-label">{{ item.type }}</span>
                  <span class="distribution-value">{{ item.count }} ({{ item.percentage | number:'1.0-0' }}%)</span>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="activity-section">
          <h2>Recent Activity</h2>
          <div class="activity-list">
            @for (activity of recentActivity(); track activity.id) {
              <div class="activity-item">
                <span class="material-symbols-outlined activity-icon" [class]="activity.type">
                  {{ getActivityIcon(activity.type) }}
                </span>
                <div class="activity-content">
                  <span class="activity-text">
                    <strong>{{ activity.entityName }}</strong>
                    {{ getActivityVerb(activity.type) }}
                  </span>
                  <span class="activity-time">{{ getRelativeTime(activity.timestamp) }}</span>
                </div>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <cds-button kind="primary" routerLink="/explorer" (click)="onNewEntry()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            New Entry
          </cds-button>
          <cds-button kind="secondary" routerLink="/sources">
            <span class="material-symbols-outlined" slot="icon">cable</span>
            New Source
          </cds-button>
          <cds-button kind="tertiary">
            <span class="material-symbols-outlined" slot="icon">upload</span>
            Import CSV
          </cds-button>
          <cds-button kind="ghost">
            <span class="material-symbols-outlined" slot="icon">download</span>
            Export All
          </cds-button>
        </div>
      </section>
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

    .stat-trend {
      display: flex;
      align-items: center;
      gap: var(--dc-space-xs);
      font-size: 0.875rem;

      &.up {
        color: var(--dc-success);
      }

      &.down {
        color: var(--dc-error);
      }

      &.stable {
        color: var(--dc-text-secondary);
      }

      .trend-icon {
        font-size: 18px;
      }
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
    .activity-section {
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

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-sm);
    }

    .activity-item {
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

    .activity-icon {
      font-size: 20px;

      &.create { color: var(--dc-success); }
      &.update { color: var(--dc-info); }
      &.delete { color: var(--dc-error); }
      &.import { color: var(--dc-warning); }
    }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-text {
      font-size: 0.875rem;
      color: var(--dc-text-primary);
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--dc-text-secondary);
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
export class DashboardComponent {
  // Mock data - will be replaced with real data from stores
  readonly stats = signal<StatCard[]>([
    { label: 'Catalog Entries', value: 245, trend: 'up', trendValue: 12, icon: 'folder_open', color: '#0f62fe', link: '/explorer' },
    { label: 'Source Connections', value: 12, trend: 'up', trendValue: 2, icon: 'cable', color: '#24a148', link: '/sources' },
    { label: 'Labels', value: 8, trend: 'down', trendValue: -1, icon: 'label', color: '#8a3ffc', link: '/labels' },
    { label: 'Source Types', value: 6, trend: 'stable', trendValue: 0, icon: 'category', color: '#d02670', link: '/sources' }
  ]);

  readonly distribution = signal([
    { type: 'PostgreSQL', count: 98, percentage: 40, color: 'var(--dc-source-postgresql)' },
    { type: 'InfluxDB', count: 73, percentage: 30, color: 'var(--dc-source-influxdb)' },
    { type: 'MQTT', count: 37, percentage: 15, color: 'var(--dc-source-mqtt)' },
    { type: 'OPC-UA', count: 24, percentage: 10, color: 'var(--dc-source-opcua)' },
    { type: 'Other', count: 13, percentage: 5, color: 'var(--dc-border-strong)' }
  ]);

  readonly recentActivity = signal<ActivityItem[]>([
    { id: '1', type: 'create', entityType: 'entry', entityName: 'temperature_sensor_01', timestamp: new Date(Date.now() - 5 * 60000) },
    { id: '2', type: 'update', entityType: 'source', entityName: 'MQTT-Production', timestamp: new Date(Date.now() - 15 * 60000) },
    { id: '3', type: 'import', entityType: 'entry', entityName: '5 entries imported', timestamp: new Date(Date.now() - 30 * 60000) },
    { id: '4', type: 'create', entityType: 'label', entityName: 'Production', timestamp: new Date(Date.now() - 60 * 60000) },
    { id: '5', type: 'delete', entityType: 'entry', entityName: 'old_sensor_data', timestamp: new Date(Date.now() - 120 * 60000) }
  ]);

  onNewEntry(): void {
    // TODO: Open new entry modal
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      create: 'add_circle',
      update: 'edit',
      delete: 'delete',
      import: 'upload_file'
    };
    return icons[type] || 'info';
  }

  getActivityVerb(type: string): string {
    const verbs: Record<string, string> = {
      create: 'was created',
      update: 'was updated',
      delete: 'was deleted',
      import: ''
    };
    return verbs[type] || '';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }
}

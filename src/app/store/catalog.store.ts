import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap, forkJoin } from 'rxjs';
import { ApiService } from '../core/services';
import {
  CatalogEntry,
  SourceConnection,
  Label,
  SourceType,
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest,
  SourceConnectionCreateRequest,
  SourceConnectionAmendRequest
} from '../core/models';

// Source type colors mapping
const SOURCE_TYPE_COLORS: Record<string, string> = {
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

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly api = inject(ApiService);

  // State signals
  readonly entries = signal<CatalogEntry[]>([]);
  readonly sourceConnections = signal<SourceConnection[]>([]);
  readonly labels = signal<Label[]>([]);
  readonly sourceTypes = signal<SourceType[]>([]);

  // Loading states
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed values for dashboard
  readonly totalEntries = computed(() => this.entries().length);
  readonly totalSources = computed(() => this.sourceConnections().length);
  readonly totalLabels = computed(() => this.labels().length);
  readonly totalSourceTypes = computed(() => this.sourceTypes().length);

  readonly entriesBySourceType = computed(() => {
    const entries = this.entries();
    const total = entries.length;
    if (total === 0) return [];

    const counts = new Map<string, number>();
    entries.forEach(entry => {
      const type = entry.sourceConnection?.sourceType?.name || 'Unknown';
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100),
        color: SOURCE_TYPE_COLORS[type] || 'var(--dc-border-strong)'
      }))
      .sort((a, b) => b.count - a.count);
  });

  // Load all data
  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      entries: this.api.getCatalogEntries().pipe(catchError(() => of([]))),
      connections: this.api.getSourceConnections().pipe(catchError(() => of([]))),
      labels: this.api.getLabels().pipe(catchError(() => of([]))),
      types: this.api.getSourceTypes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ entries, connections, labels, types }) => {
        this.entries.set(entries);
        this.sourceConnections.set(connections);
        this.labels.set(labels);
        this.sourceTypes.set(types);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load data');
        this.loading.set(false);
        console.error('Store load error:', err);
      }
    });
  }

  // ============ Catalog Entries ============
  loadEntries(): void {
    this.loading.set(true);
    this.api.getCatalogEntries().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load entries');
        this.loading.set(false);
      }
    });
  }

  createEntry(entry: CatalogEntryCreateRequest): void {
    this.loading.set(true);
    this.api.createCatalogEntries([entry]).subscribe({
      next: (created) => {
        this.entries.update(entries => [...entries, ...created]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to create entry');
        this.loading.set(false);
      }
    });
  }

  updateEntry(entry: CatalogEntryAmendRequest): void {
    this.loading.set(true);
    this.api.updateCatalogEntries([entry]).subscribe({
      next: (updated) => {
        this.entries.update(entries =>
          entries.map(e => e.id === entry.id ? { ...e, ...updated[0] } : e)
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to update entry');
        this.loading.set(false);
      }
    });
  }

  deleteEntries(ids: string[]): void {
    this.loading.set(true);
    this.api.deleteCatalogEntries(ids).subscribe({
      next: () => {
        this.entries.update(entries => entries.filter(e => !ids.includes(e.id)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to delete entries');
        this.loading.set(false);
      }
    });
  }

  // ============ Source Connections ============
  loadSourceConnections(): void {
    this.loading.set(true);
    this.api.getSourceConnections().subscribe({
      next: (connections) => {
        this.sourceConnections.set(connections);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load source connections');
        this.loading.set(false);
      }
    });
  }

  createSourceConnection(connection: SourceConnectionCreateRequest): void {
    this.loading.set(true);
    this.api.createSourceConnections([connection]).subscribe({
      next: (created) => {
        this.sourceConnections.update(conns => [...conns, ...created]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to create source connection');
        this.loading.set(false);
      }
    });
  }

  updateSourceConnection(connection: SourceConnectionAmendRequest): void {
    this.loading.set(true);
    this.api.updateSourceConnections([connection]).subscribe({
      next: (updated) => {
        this.sourceConnections.update(conns =>
          conns.map(c => c.id === connection.id ? { ...c, ...updated[0] } : c)
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to update source connection');
        this.loading.set(false);
      }
    });
  }

  deleteSourceConnections(ids: string[]): void {
    this.loading.set(true);
    this.api.deleteSourceConnections(ids).subscribe({
      next: () => {
        this.sourceConnections.update(conns => conns.filter(c => !ids.includes(c.id)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to delete source connections');
        this.loading.set(false);
      }
    });
  }

  // ============ Labels ============
  loadLabels(): void {
    this.loading.set(true);
    this.api.getLabels().subscribe({
      next: (labels) => {
        this.labels.set(labels);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load labels');
        this.loading.set(false);
      }
    });
  }

  createLabel(label: Omit<Label, 'id'>): void {
    this.loading.set(true);
    this.api.createLabels([label as Label]).subscribe({
      next: (created) => {
        this.labels.update(labels => [...labels, ...created]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to create label');
        this.loading.set(false);
      }
    });
  }

  deleteLabels(ids: string[]): void {
    this.loading.set(true);
    this.api.deleteLabels(ids).subscribe({
      next: () => {
        this.labels.update(labels => labels.filter(l => !ids.includes(l.id)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to delete labels');
        this.loading.set(false);
      }
    });
  }

  // ============ Source Types ============
  loadSourceTypes(): void {
    this.api.getSourceTypes().subscribe({
      next: (types) => this.sourceTypes.set(types),
      error: (err) => console.error('Failed to load source types:', err)
    });
  }
}

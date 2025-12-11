import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { catchError, of, forkJoin } from 'rxjs';
import { ApiService, PollingService } from '../core/services';
import { EntryStore } from './entry.store';
import { ConnectionStore } from './connection.store';
import { LabelStore } from './label.store';
import { SourceTypeStore } from './source-type.store';
import type {
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest,
  SourceConnectionCreateRequest,
  SourceConnectionAmendRequest,
  Label
} from '@industream/datacatalog-client/dto';
import { ConflictStrategy } from '@industream/datacatalog-client/dto';

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

/**
 * Facade store that composes specialized stores for backward compatibility.
 * New code should prefer injecting specialized stores directly.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly polling = inject(PollingService);
  private readonly POLLING_KEY = 'catalog-store';

  // Composed stores
  private readonly entryStore = inject(EntryStore);
  private readonly connectionStore = inject(ConnectionStore);
  private readonly labelStore = inject(LabelStore);
  private readonly sourceTypeStore = inject(SourceTypeStore);

  // Expose state from composed stores (backward compatibility)
  readonly entries = this.entryStore.entries;
  readonly sourceConnections = this.connectionStore.connections;
  readonly labels = this.labelStore.labels;
  readonly sourceTypes = this.sourceTypeStore.sourceTypes;

  // Loading states - aggregate from all stores
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed values for dashboard
  readonly totalEntries = this.entryStore.total;
  readonly totalSources = this.connectionStore.total;
  readonly totalLabels = this.labelStore.total;
  readonly totalSourceTypes = this.sourceTypeStore.total;

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

  constructor() {
    this.polling.register(this.POLLING_KEY, () => this.refreshSilently());
  }

  ngOnDestroy(): void {
    this.polling.unregister(this.POLLING_KEY);
  }

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
        this.entryStore.setEntries(entries);
        this.connectionStore.setConnections(connections);
        this.labelStore.setLabels(labels);
        this.sourceTypeStore.setSourceTypes(types);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load data');
        this.loading.set(false);
      }
    });
  }

  // Silent refresh for polling
  private refreshSilently(): void {
    forkJoin({
      entries: this.api.getCatalogEntries().pipe(catchError(() => of(this.entries()))),
      connections: this.api.getSourceConnections().pipe(catchError(() => of(this.sourceConnections()))),
      labels: this.api.getLabels().pipe(catchError(() => of(this.labels()))),
      types: this.api.getSourceTypes().pipe(catchError(() => of(this.sourceTypes())))
    }).subscribe({
      next: ({ entries, connections, labels, types }) => {
        this.entryStore.setEntries(entries);
        this.connectionStore.setConnections(connections);
        this.labelStore.setLabels(labels);
        this.sourceTypeStore.setSourceTypes(types);
      }
    });
  }

  // ============ Catalog Entries (delegate to EntryStore) ============
  loadEntries(): void {
    this.entryStore.load();
  }

  createEntry(entry: CatalogEntryCreateRequest): void {
    this.entryStore.create(entry);
  }

  updateEntry(entry: CatalogEntryAmendRequest): void {
    this.entryStore.update(entry);
  }

  deleteEntries(ids: string[]): void {
    this.entryStore.delete(ids);
  }

  // ============ Source Connections (delegate to ConnectionStore) ============
  loadSourceConnections(): void {
    this.connectionStore.load();
  }

  createSourceConnection(connection: SourceConnectionCreateRequest): void {
    this.connectionStore.create(connection);
  }

  updateSourceConnection(connection: SourceConnectionAmendRequest): void {
    this.connectionStore.update(connection);
  }

  deleteSourceConnections(ids: string[]): void {
    this.connectionStore.delete(ids);
  }

  // ============ Labels (delegate to LabelStore) ============
  loadLabels(): void {
    this.labelStore.load();
  }

  createLabel(label: Omit<Label, 'id'>): void {
    this.labelStore.create(label);
  }

  deleteLabels(ids: string[]): void {
    this.labelStore.delete(ids);
  }

  // ============ Source Types (delegate to SourceTypeStore) ============
  loadSourceTypes(): void {
    this.sourceTypeStore.load();
  }

  createSourceType(sourceType: { name: string }): void {
    this.sourceTypeStore.create(sourceType);
  }

  updateSourceType(sourceType: { id: string; name: string }): void {
    this.sourceTypeStore.update(sourceType);
  }

  deleteSourceTypes(ids: string[]): void {
    this.sourceTypeStore.delete(ids);
  }

  // ============ Import/Export ============
  importCatalogEntries(file: File, conflictStrategy: ConflictStrategy = ConflictStrategy.Replace): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);
    this.error.set(null);

    return new Promise((resolve) => {
      this.api.importCatalogEntries(file, conflictStrategy).subscribe({
        next: () => {
          this.loadAll();
          resolve({ success: true });
        },
        error: (err) => {
          const errorMessage = err.error?.title || err.message || 'Failed to import CSV';
          this.error.set(errorMessage);
          this.loading.set(false);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  }

  exportCatalogEntries(): void {
    this.api.exportCatalogEntries().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `datacatalog-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.error.set('Failed to export catalog');
      }
    });
  }
}

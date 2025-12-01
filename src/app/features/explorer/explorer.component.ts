import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, inject, OnInit, computed } from '@angular/core';

import '@carbon/web-components/es/components/search/index.js';
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/data-table/index.js';
import '@carbon/web-components/es/components/tag/index.js';
import '@carbon/web-components/es/components/checkbox/index.js';
import '@carbon/web-components/es/components/overflow-menu/index.js';

import { CatalogStore } from '../../store';
import { CatalogEntry, DataType } from '../../core/models';

type ViewMode = 'table' | 'grid' | 'list';

@Component({
  selector: 'app-explorer',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="explorer-container">
      <header class="explorer-header">
        <h1>Explorer</h1>
        <p class="subtitle">Browse and manage your catalog entries</p>
      </header>

      <div class="toolbar">
        <div class="search-section">
          <cds-search
            size="lg"
            placeholder="Search entries..."
            [value]="searchQuery()"
            (cds-search-input)="onSearch($event)">
          </cds-search>
        </div>

        <div class="filters">
          <select class="filter-select" (change)="onSourceTypeFilter($event)">
            <option value="">All Source Types</option>
            @for (type of store.sourceTypes(); track type.id) {
              <option [value]="type.name">{{ type.name }}</option>
            }
          </select>
        </div>

        <div class="view-toggle">
          @for (view of viewModes; track view.id) {
            <button
              class="view-btn"
              [class.active]="currentView() === view.id"
              (click)="setView(view.id)"
              [title]="view.label">
              <span class="material-symbols-outlined">{{ view.icon }}</span>
            </button>
          }
        </div>

        <div class="actions">
          <cds-button kind="primary" (click)="onNewEntry()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            New Entry
          </cds-button>
        </div>
      </div>

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading entries...</p>
        </div>
      } @else if (filteredEntries().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">folder_open</span>
          <h2>No entries found</h2>
          <p>{{ searchQuery() ? 'Try adjusting your search criteria' : 'Create your first catalog entry to get started' }}</p>
          @if (!searchQuery()) {
            <cds-button kind="primary" (click)="onNewEntry()">
              <span class="material-symbols-outlined" slot="icon">add</span>
              Create Entry
            </cds-button>
          }
        </div>
      } @else {
        <div class="content-area" [class]="currentView()">
          @switch (currentView()) {
            @case ('table') {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th class="checkbox-col">
                        <input
                          type="checkbox"
                          [checked]="allSelected()"
                          [indeterminate]="someSelected()"
                          (change)="toggleSelectAll()">
                      </th>
                      <th class="name-col">Name</th>
                      <th class="type-col">Data Type</th>
                      <th class="source-col">Source Connection</th>
                      <th class="labels-col">Labels</th>
                      <th class="actions-col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (entry of filteredEntries(); track entry.id) {
                      <tr [class.selected]="selectedIds().has(entry.id)">
                        <td class="checkbox-col">
                          <input
                            type="checkbox"
                            [checked]="selectedIds().has(entry.id)"
                            (change)="toggleSelect(entry.id)">
                        </td>
                        <td class="name-col">
                          <span class="entry-name">{{ entry.name }}</span>
                        </td>
                        <td class="type-col">
                          <span class="data-type-badge">{{ entry.dataType }}</span>
                        </td>
                        <td class="source-col">
                          <div class="source-info">
                            <span class="source-type-badge" [style.background]="getSourceColor(entry.sourceConnection?.sourceType?.name)">
                              {{ entry.sourceConnection?.sourceType?.name || 'Unknown' }}
                            </span>
                            <span class="source-name">{{ entry.sourceConnection?.name }}</span>
                          </div>
                        </td>
                        <td class="labels-col">
                          <div class="labels-list">
                            @for (label of entry.labels || []; track label.id) {
                              <span class="label-tag">{{ label.name }}</span>
                            }
                            @if (!entry.labels || entry.labels.length === 0) {
                              <span class="no-labels">-</span>
                            }
                          </div>
                        </td>
                        <td class="actions-col">
                          <button class="icon-btn" title="Edit" (click)="onEditEntry(entry)">
                            <span class="material-symbols-outlined">edit</span>
                          </button>
                          <button class="icon-btn danger" title="Delete" (click)="onDeleteEntry(entry)">
                            <span class="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            @case ('grid') {
              <div class="grid-view">
                @for (entry of filteredEntries(); track entry.id) {
                  <div class="entry-card" (click)="onEditEntry(entry)">
                    <div class="card-header">
                      <span class="source-type-badge" [style.background]="getSourceColor(entry.sourceConnection?.sourceType?.name)">
                        {{ entry.sourceConnection?.sourceType?.name || 'Unknown' }}
                      </span>
                      <span class="data-type-badge">{{ entry.dataType }}</span>
                    </div>
                    <h3 class="card-title">{{ entry.name }}</h3>
                    <p class="card-source">{{ entry.sourceConnection?.name }}</p>
                    <div class="card-labels">
                      @for (label of (entry.labels || []).slice(0, 3); track label.id) {
                        <span class="label-tag">{{ label.name }}</span>
                      }
                      @if ((entry.labels?.length || 0) > 3) {
                        <span class="more-labels">+{{ (entry.labels?.length || 0) - 3 }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
            @case ('list') {
              <div class="list-view">
                @for (entry of filteredEntries(); track entry.id) {
                  <div class="list-item" (click)="onEditEntry(entry)">
                    <div class="list-item-main">
                      <span class="entry-name">{{ entry.name }}</span>
                      <span class="data-type-badge">{{ entry.dataType }}</span>
                    </div>
                    <div class="list-item-meta">
                      <span class="source-type-badge" [style.background]="getSourceColor(entry.sourceConnection?.sourceType?.name)">
                        {{ entry.sourceConnection?.sourceType?.name }}
                      </span>
                      <span class="source-name">{{ entry.sourceConnection?.name }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Bulk Actions Bar -->
        @if (selectedIds().size > 0) {
          <div class="bulk-actions-bar">
            <span class="selection-count">{{ selectedIds().size }} selected</span>
            <cds-button kind="danger" size="sm" (click)="onBulkDelete()">
              <span class="material-symbols-outlined" slot="icon">delete</span>
              Delete Selected
            </cds-button>
            <cds-button kind="ghost" size="sm" (click)="clearSelection()">
              Cancel
            </cds-button>
          </div>
        }

        <!-- Pagination -->
        <div class="pagination">
          <span class="count">Showing {{ filteredEntries().length }} of {{ store.entries().length }} entries</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .explorer-container {
      padding: var(--dc-space-xl);
      max-width: 1600px;
      margin: 0 auto;
    }

    .explorer-header {
      margin-bottom: var(--dc-space-lg);

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

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--dc-space-lg);
      margin-bottom: var(--dc-space-lg);
      padding: var(--dc-space-md);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      flex-wrap: wrap;
    }

    .search-section {
      flex: 1;
      min-width: 200px;
      max-width: 400px;
    }

    .filters {
      display: flex;
      gap: var(--dc-space-sm);
    }

    .filter-select {
      padding: 8px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;
      cursor: pointer;

      &:focus {
        outline: 2px solid var(--dc-primary);
        outline-offset: 2px;
      }
    }

    .view-toggle {
      display: flex;
      gap: 2px;
      background: var(--dc-bg-tertiary);
      padding: 2px;
      border-radius: var(--dc-radius-sm);
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: var(--dc-radius-sm);
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--dc-primary);
        color: white;
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-2xl);
      text-align: center;
      background: var(--dc-bg-secondary);
      border: 2px dashed var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      min-height: 400px;

      .material-symbols-outlined {
        font-size: 64px;
        color: var(--dc-text-secondary);
        margin-bottom: var(--dc-space-lg);
      }

      h2 {
        margin: 0 0 var(--dc-space-sm);
      }

      p {
        margin: 0 0 var(--dc-space-lg);
        color: var(--dc-text-secondary);
      }
    }

    /* Table View */
    .table-container {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: var(--dc-space-md);
        text-align: left;
        border-bottom: 1px solid var(--dc-border-subtle);
      }

      th {
        background: var(--dc-bg-tertiary);
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--dc-text-secondary);
      }

      tr:hover {
        background: var(--dc-bg-tertiary);
      }

      tr.selected {
        background: color-mix(in srgb, var(--dc-primary) 10%, transparent);
      }
    }

    .checkbox-col {
      width: 40px;
    }

    .name-col {
      min-width: 200px;
    }

    .entry-name {
      font-weight: 500;
      color: var(--dc-text-primary);
    }

    .type-col {
      width: 100px;
    }

    .data-type-badge {
      display: inline-block;
      padding: 2px 8px;
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--dc-text-secondary);
    }

    .source-col {
      min-width: 200px;
    }

    .source-info {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
    }

    .source-type-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--dc-radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .source-name {
      color: var(--dc-text-secondary);
      font-size: 0.875rem;
    }

    .labels-col {
      min-width: 150px;
    }

    .labels-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .label-tag {
      display: inline-block;
      padding: 2px 8px;
      background: var(--dc-primary);
      border-radius: var(--dc-radius-full);
      font-size: 0.75rem;
      color: white;
    }

    .no-labels {
      color: var(--dc-text-placeholder);
    }

    .actions-col {
      width: 80px;
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: var(--dc-radius-sm);
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-tertiary);
        color: var(--dc-text-primary);
      }

      &.danger:hover {
        background: color-mix(in srgb, var(--dc-error) 15%, transparent);
        color: var(--dc-error);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    /* Grid View */
    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--dc-space-lg);
    }

    .entry-card {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      padding: var(--dc-space-lg);
      cursor: pointer;
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-primary);
        box-shadow: var(--dc-shadow-md);
        transform: translateY(-2px);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--dc-space-md);
      }

      .card-title {
        margin: 0 0 var(--dc-space-xs);
        font-size: 1rem;
        font-weight: 600;
        color: var(--dc-text-primary);
      }

      .card-source {
        margin: 0 0 var(--dc-space-md);
        font-size: 0.875rem;
        color: var(--dc-text-secondary);
      }

      .card-labels {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .more-labels {
        padding: 2px 8px;
        background: var(--dc-bg-tertiary);
        border-radius: var(--dc-radius-full);
        font-size: 0.75rem;
        color: var(--dc-text-secondary);
      }
    }

    /* List View */
    .list-view {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      overflow: hidden;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-md) var(--dc-space-lg);
      background: var(--dc-bg-secondary);
      cursor: pointer;
      transition: background var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-tertiary);
      }

      .list-item-main {
        display: flex;
        align-items: center;
        gap: var(--dc-space-md);
      }

      .list-item-meta {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
      }
    }

    /* Bulk Actions Bar */
    .bulk-actions-bar {
      position: fixed;
      bottom: var(--dc-space-xl);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      padding: var(--dc-space-md) var(--dc-space-lg);
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-strong);
      border-radius: var(--dc-radius-md);
      box-shadow: var(--dc-shadow-lg);

      .selection-count {
        font-weight: 500;
        color: var(--dc-text-primary);
      }
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      padding: var(--dc-space-lg);
      color: var(--dc-text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class ExplorerComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly viewModes = [
    { id: 'table' as ViewMode, label: 'Table View', icon: 'table_rows' },
    { id: 'grid' as ViewMode, label: 'Grid View', icon: 'grid_view' },
    { id: 'list' as ViewMode, label: 'List View', icon: 'view_list' }
  ];

  readonly currentView = signal<ViewMode>('table');
  readonly searchQuery = signal('');
  readonly sourceTypeFilter = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());

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

  readonly filteredEntries = computed(() => {
    let entries = this.store.entries();
    const query = this.searchQuery().toLowerCase();
    const typeFilter = this.sourceTypeFilter();

    if (query) {
      entries = entries.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.sourceConnection?.name?.toLowerCase().includes(query)
      );
    }

    if (typeFilter) {
      entries = entries.filter(e =>
        e.sourceConnection?.sourceType?.name === typeFilter
      );
    }

    return entries;
  });

  readonly allSelected = computed(() => {
    const entries = this.filteredEntries();
    return entries.length > 0 && entries.every(e => this.selectedIds().has(e.id));
  });

  readonly someSelected = computed(() => {
    const selected = this.selectedIds();
    const entries = this.filteredEntries();
    return entries.some(e => selected.has(e.id)) && !this.allSelected();
  });

  ngOnInit(): void {
    if (this.store.entries().length === 0) {
      this.store.loadAll();
    }
  }

  setView(viewId: ViewMode): void {
    this.currentView.set(viewId);
  }

  onSearch(event: Event): void {
    const customEvent = event as CustomEvent;
    this.searchQuery.set(customEvent.detail?.value || '');
  }

  onSourceTypeFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sourceTypeFilter.set(select.value);
  }

  getSourceColor(type: string | undefined): string {
    return this.sourceTypeColors[type || ''] || 'var(--dc-border-strong)';
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(ids => {
      const newSet = new Set(ids);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const allIds = this.filteredEntries().map(e => e.id);
      this.selectedIds.set(new Set(allIds));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  onNewEntry(): void {
    // TODO: Open new entry modal
    console.log('New entry clicked');
  }

  onEditEntry(entry: CatalogEntry): void {
    // TODO: Open edit modal
    console.log('Edit entry:', entry);
  }

  onDeleteEntry(entry: CatalogEntry): void {
    if (confirm(`Delete "${entry.name}"?`)) {
      this.store.deleteEntries([entry.id]);
    }
  }

  onBulkDelete(): void {
    const count = this.selectedIds().size;
    if (confirm(`Delete ${count} entries?`)) {
      this.store.deleteEntries(Array.from(this.selectedIds()));
      this.clearSelection();
    }
  }
}

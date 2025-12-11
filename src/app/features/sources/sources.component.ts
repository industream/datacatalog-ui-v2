import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, computed } from '@angular/core';

import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/modal/index.js';
import '@carbon/web-components/es/components/text-input/index.js';
import '@carbon/web-components/es/components/dropdown/index.js';

import { CatalogStore } from '../../store';
import type { SourceConnection, SourceType } from '@industream/datacatalog-client/dto';
import { ConnectionParamsEditorComponent } from './components/connection-params-editor.component';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [ConnectionParamsEditorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="sources-container">
      <header class="sources-header">
        <div class="header-content">
          <h1>Source Connections</h1>
          <p class="subtitle">Manage your data source connections</p>
        </div>
        <cds-button kind="primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          New Connection
        </cds-button>
      </header>

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading connections...</p>
        </div>
      } @else if (store.sourceConnections().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">cable</span>
          <h2>No source connections</h2>
          <p>Create your first source connection to start importing data</p>
          <cds-button kind="primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            Create Connection
          </cds-button>
        </div>
      } @else {
        <!-- Source Type Filter -->
        <div class="filter-bar">
          <div class="type-filters">
            <button
              class="type-filter-btn"
              [class.active]="selectedType() === null"
              (click)="filterByType(null)">
              All ({{ store.sourceConnections().length }})
            </button>
            @for (type of sourceTypesWithCount(); track type.id) {
              <button
                class="type-filter-btn"
                [class.active]="selectedType() === type.name"
                [style.--type-color]="getSourceColor(type.name)"
                (click)="filterByType(type.name)">
                {{ type.name }} ({{ type.count }})
              </button>
            }
          </div>
        </div>

        <!-- Connections Grid -->
        <div class="connections-grid">
          @for (connection of filteredConnections(); track connection.id) {
            <div class="connection-card">
              <div class="card-header">
                <span class="source-type-badge" [style.background]="getSourceColor(connection.sourceType.name)">
                  {{ connection.sourceType.name || 'Unknown' }}
                </span>
                <div class="card-actions">
                  <button class="icon-btn" title="Edit" (click)="onEditConnection(connection)">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="icon-btn danger" title="Delete" (click)="onDeleteConnection(connection)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
              <h3 class="card-title">{{ connection.name }}</h3>
              <div class="card-details">
                @if (connection['host']) {
                  <div class="detail-row">
                    <span class="detail-label">Host:</span>
                    <span class="detail-value">{{ connection['host'] }}</span>
                  </div>
                }
                @if (connection['port']) {
                  <div class="detail-row">
                    <span class="detail-label">Port:</span>
                    <span class="detail-value">{{ connection['port'] }}</span>
                  </div>
                }
                @if (connection['database']) {
                  <div class="detail-row">
                    <span class="detail-label">Database:</span>
                    <span class="detail-value">{{ connection['database'] }}</span>
                  </div>
                }
                @if (connection['bucket']) {
                  <div class="detail-row">
                    <span class="detail-label">Bucket:</span>
                    <span class="detail-value">{{ connection['bucket'] }}</span>
                  </div>
                }
                @if (connection['topic']) {
                  <div class="detail-row">
                    <span class="detail-label">Topic:</span>
                    <span class="detail-value">{{ connection['topic'] }}</span>
                  </div>
                }
                @if (connection['url']) {
                  <div class="detail-row">
                    <span class="detail-label">URL:</span>
                    <span class="detail-value">{{ connection['url'] }}</span>
                  </div>
                }
              </div>
              <div class="card-footer">
                <span class="entry-count">
                  {{ getEntryCount(connection.id) }} entries
                </span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h2>{{ editingConnection() ? 'Edit Connection' : 'New Connection' }}</h2>
              <button type="button" class="icon-btn" (click)="closeModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="conn-name">Name</label>
                <input
                  type="text"
                  id="conn-name"
                  class="form-input"
                  [value]="formData()['name']"
                  (input)="updateFormField('name', $event)">
              </div>
              <div class="form-group">
                <label for="conn-type">Source Type</label>
                <select
                  id="conn-type"
                  class="form-select"
                  (change)="updateFormField('sourceTypeId', $event)"
                  [disabled]="!!editingConnection()">
                  <option value="">Select a type...</option>
                  @for (type of store.sourceTypes(); track type.id) {
                    <option [value]="type.id" [selected]="type.id === formData()['sourceTypeId']">{{ type.name }}</option>
                  }
                </select>
              </div>

              <!-- Dynamic fields based on source type -->
              @if (selectedSourceType()) {
                @if (isDataBridgeType()) {
                  <div class="form-group">
                    <label for="url">URL</label>
                    <input type="text" id="url" class="form-input" [value]="formData()['url'] || ''" (input)="updateFormField('url', $event)" placeholder="https://...">
                  </div>
                } @else {
                  <app-connection-params-editor
                    [initialParams]="connectionParams()"
                    (paramsChange)="onParamsChange($event)">
                  </app-connection-params-editor>
                }
              }
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="saveConnection()">
                {{ editingConnection() ? 'Update' : 'Create' }}
              </cds-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sources-container {
      padding: calc(var(--dc-card-padding) * 2);
      max-width: 1400px;
      margin: 0 auto;
    }

    .sources-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--dc-header-gap);

      .header-content {
        h1 {
          margin: 0 0 var(--dc-space-xs);
          font-weight: 600;
        }

        .subtitle {
          margin: 0;
          color: var(--dc-text-secondary);
          font-size: var(--dc-text-size-base);
        }
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

    .filter-bar {
      margin-bottom: var(--dc-header-gap);
    }

    .type-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dc-space-sm);
    }

    .type-filter-btn {
      padding: var(--dc-button-padding);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-full);
      background: var(--dc-bg-secondary);
      color: var(--dc-text-secondary);
      font-size: var(--dc-text-size-base);
      cursor: pointer;
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-border-strong);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--type-color, var(--dc-primary));
        border-color: var(--type-color, var(--dc-primary));
        color: white;
      }
    }

    .connections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--dc-grid-gap);
    }

    .connection-card {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      padding: var(--dc-card-padding);
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-border-strong);
        box-shadow: var(--dc-shadow-md);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--dc-header-gap);
      }

      .card-actions {
        display: flex;
        gap: calc(var(--dc-space-unit) / 2);
      }

      .card-title {
        margin: 0 0 var(--dc-header-gap);
        font-size: var(--dc-text-size-lg);
        font-weight: 600;
        color: var(--dc-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-details {
        display: flex;
        flex-direction: column;
        gap: var(--dc-space-xs);
        margin-bottom: var(--dc-header-gap);
      }

      .detail-row {
        display: flex;
        gap: var(--dc-space-sm);
        font-size: var(--dc-text-size-base);
      }

      .detail-label {
        color: var(--dc-text-secondary);
        min-width: 70px;
      }

      .detail-value {
        color: var(--dc-text-primary);
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 180px;
      }

      .card-footer {
        padding-top: var(--dc-header-gap);
        border-top: 1px solid var(--dc-border-subtle);
      }

      .entry-count {
        font-size: var(--dc-text-size-base);
        color: var(--dc-text-secondary);
      }
    }

    .source-type-badge {
      display: inline-block;
      padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
      border-radius: var(--dc-radius-sm);
      font-size: var(--dc-text-size-sm);
      font-weight: 500;
      color: white;
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

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--dc-bg-secondary);
      border-radius: var(--dc-radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);

      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .modal-body {
      padding: var(--dc-space-lg);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-lg);
      border-top: 1px solid var(--dc-border-subtle);
    }

    .form-group {
      margin-bottom: var(--dc-space-md);

      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--dc-text-secondary);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dc-space-md);
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: 10px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .info-text {
      color: var(--dc-text-secondary);
      font-size: 0.875rem;
      font-style: italic;
    }

    .field-hint {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--dc-text-secondary);
      font-style: italic;
    }
  `]
})
export class SourcesComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly selectedType = signal<string | null>(null);
  readonly showModal = signal(false);
  readonly editingConnection = signal<SourceConnection | null>(null);
  readonly formData = signal<Record<string, unknown>>({ name: '', sourceTypeId: '' });

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

  readonly sourceTypesWithCount = computed(() => {
    const connections = this.store.sourceConnections();
    const counts = new Map<string, number>();

    connections.forEach(conn => {
      const typeName = conn.sourceType?.name;
      if (typeName) {
        counts.set(typeName, (counts.get(typeName) || 0) + 1);
      }
    });

    return this.store.sourceTypes()
      .filter(type => counts.has(type.name))
      .map(type => ({
        ...type,
        count: counts.get(type.name) || 0
      }));
  });

  readonly filteredConnections = computed(() => {
    const type = this.selectedType();
    const connections = this.store.sourceConnections();

    if (!type) return connections;
    return connections.filter(c => c.sourceType?.name === type);
  });

  readonly selectedSourceType = computed(() => {
    const typeId = this.formData()['sourceTypeId'] as string;
    return this.store.sourceTypes().find(t => t.id === typeId) || null;
  });

  readonly connectionParams = computed(() => {
    const data = this.formData();
    const { name, sourceTypeId, ...params } = data;
    return params;
  });

  // DataBridge sourceType ID - should be configured based on your API
  private readonly DATABRIDGE_TYPE_ID = 'databridge';

  ngOnInit(): void {
    if (this.store.sourceConnections().length === 0) {
      this.store.loadAll();
    }
  }

  isDataBridgeType(): boolean {
    const selectedType = this.selectedSourceType();
    // Check by ID instead of name
    return selectedType?.id.toLowerCase() === this.DATABRIDGE_TYPE_ID ||
           selectedType?.name.toLowerCase() === 'databridge';
  }

  getConnectionParams(): Record<string, unknown> {
    const data = this.formData();
    const { name, sourceTypeId, ...params } = data;
    return params;
  }

  onParamsChange(params: Record<string, string>): void {
    // Clean formData: remove all keys except name and sourceTypeId, then add the new params
    this.formData.update(data => {
      const { name, sourceTypeId } = data;
      return {
        name,
        sourceTypeId,
        ...params
      };
    });
  }

  getSourceColor(type: string | undefined): string {
    return this.sourceTypeColors[type || ''] || 'var(--dc-border-strong)';
  }

  getEntryCount(connectionId: string): number {
    return this.store.entries().filter(e => e.sourceConnection?.id === connectionId).length;
  }

  filterByType(type: string | null): void {
    this.selectedType.set(type);
  }

  openCreateModal(): void {
    this.editingConnection.set(null);
    this.formData.set({ name: '', sourceTypeId: '' });
    this.showModal.set(true);
  }

  onEditConnection(connection: SourceConnection): void {
    this.editingConnection.set(connection);
    const { id, name, sourceType, ...rest } = connection;
    this.formData.set({
      name,
      sourceTypeId: sourceType?.id || '',
      ...rest
    });
    this.showModal.set(true);
  }

  onDeleteConnection(connection: SourceConnection): void {
    const entryCount = this.getEntryCount(connection.id);
    if (entryCount > 0) {
      alert(`Cannot delete "${connection.name}". It has ${entryCount} catalog entries.`);
      return;
    }
    if (confirm(`Delete "${connection.name}"?`)) {
      this.store.deleteSourceConnections([connection.id]);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingConnection.set(null);
  }

  updateFormField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
  }

  saveConnection(): void {
    const data = this.formData();
    const editing = this.editingConnection();

    if (!data['name'] || !data['sourceTypeId']) {
      alert('Please fill in required fields');
      return;
    }

    const { name, sourceTypeId, ...rest } = data;

    if (editing) {
      this.store.updateSourceConnection({
        id: editing.id,
        name: name as string,
        sourceTypeId: sourceTypeId as string,
        ...rest
      });
    } else {
      this.store.createSourceConnection({
        name: name as string,
        sourceTypeId: sourceTypeId as string,
        ...rest
      });
    }

    this.closeModal();
  }
}

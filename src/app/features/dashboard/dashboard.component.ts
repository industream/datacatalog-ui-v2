import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/tile/index.js';

import { CatalogStore } from '../../store';
import { ConflictStrategy } from '../../core/models';

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
                    <span class="source-type-badge" [style.background]="getSourceColor(source.sourceType.name)">
                      {{ source.sourceType.name || 'Unknown' }}
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
            <cds-button kind="tertiary" (click)="openImportModal()">
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

      <!-- Import Modal -->
      @if (showImportModal()) {
        <div class="modal-backdrop" (click)="closeImportModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Import CSV</h2>
              <button class="icon-btn" (click)="closeImportModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              @if (importError()) {
                <div class="error-banner">
                  <span class="material-symbols-outlined">error</span>
                  {{ importError() }}
                </div>
              }
              @if (importSuccess()) {
                <div class="success-banner">
                  <span class="material-symbols-outlined">check_circle</span>
                  Import successful!
                </div>
              }

              <div class="upload-zone"
                   [class.dragover]="isDragOver()"
                   [class.has-file]="selectedFile()"
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   (click)="fileInput.click()">
                <input #fileInput type="file" accept=".csv" (change)="onFileSelected($event)" hidden>
                @if (selectedFile()) {
                  <span class="material-symbols-outlined">description</span>
                  <p class="file-name">{{ selectedFile()?.name }}</p>
                  <p class="file-size">{{ formatFileSize(selectedFile()?.size || 0) }}</p>
                } @else {
                  <span class="material-symbols-outlined">upload_file</span>
                  <p>Drag & drop your CSV file here</p>
                  <p class="hint">or click to browse</p>
                }
              </div>

              <div class="form-group">
                <label for="conflict-strategy">Conflict Strategy</label>
                <select id="conflict-strategy" class="form-select" (change)="onStrategyChange($event)">
                  <option value="Replace" [selected]="conflictStrategy() === 'Replace'">Replace - Update existing entries</option>
                  <option value="Skip" [selected]="conflictStrategy() === 'Skip'">Skip - Keep existing entries</option>
                  <option value="Fail" [selected]="conflictStrategy() === 'Fail'">Fail - Abort on conflict</option>
                </select>
                <span class="field-hint">
                  @switch (conflictStrategy()) {
                    @case ('Replace') { Existing entries with the same name will be updated }
                    @case ('Skip') { Existing entries will be preserved, only new entries imported }
                    @case ('Fail') { Import will fail if any entry already exists }
                  }
                </span>
              </div>

              <div class="csv-format-info">
                <h4>CSV Format</h4>
                <p>Separator: <code>;</code> (semicolon)</p>
                <p>Required headers: <code>Name</code>, <code>DataType</code></p>
                <p>Labels format: <code>["label1","label2"]</code></p>
              </div>
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeImportModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="onImport()" [disabled]="!selectedFile() || importing()">
                @if (importing()) {
                  <span class="material-symbols-outlined animate-spin" slot="icon">sync</span>
                  Importing...
                } @else {
                  <span class="material-symbols-outlined" slot="icon">upload</span>
                  Import
                }
              </cds-button>
            </div>
          </div>
        </div>
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

    /* Modal styles */
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

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .upload-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-xl);
      border: 2px dashed var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      background: var(--dc-bg-tertiary);
      cursor: pointer;
      transition: all var(--dc-duration-fast);
      margin-bottom: var(--dc-space-lg);

      &:hover, &.dragover {
        border-color: var(--dc-primary);
        background: color-mix(in srgb, var(--dc-primary) 5%, var(--dc-bg-tertiary));
      }

      &.has-file {
        border-style: solid;
        border-color: var(--dc-success);
      }

      .material-symbols-outlined {
        font-size: 48px;
        color: var(--dc-text-secondary);
        margin-bottom: var(--dc-space-sm);
      }

      p {
        margin: 0;
        color: var(--dc-text-secondary);

        &.file-name {
          color: var(--dc-text-primary);
          font-weight: 500;
        }

        &.file-size {
          font-size: 0.875rem;
        }

        &.hint {
          font-size: 0.875rem;
          margin-top: var(--dc-space-xs);
        }
      }
    }

    .form-group {
      margin-bottom: var(--dc-space-lg);

      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--dc-text-secondary);
      }
    }

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
    }

    .field-hint {
      display: block;
      margin-top: var(--dc-space-xs);
      font-size: 0.75rem;
      color: var(--dc-text-secondary);
      font-style: italic;
    }

    .csv-format-info {
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      padding: var(--dc-space-md);

      h4 {
        margin: 0 0 var(--dc-space-sm);
        font-size: 0.875rem;
        color: var(--dc-text-primary);
      }

      p {
        margin: 0 0 var(--dc-space-xs);
        font-size: 0.75rem;
        color: var(--dc-text-secondary);

        &:last-child {
          margin-bottom: 0;
        }
      }

      code {
        background: var(--dc-bg-secondary);
        padding: 2px 6px;
        border-radius: var(--dc-radius-sm);
        font-family: monospace;
        font-size: 0.75rem;
      }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-md);
      background: color-mix(in srgb, var(--dc-error) 10%, transparent);
      border: 1px solid var(--dc-error);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-error);
      margin-bottom: var(--dc-space-lg);

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .success-banner {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-md);
      background: color-mix(in srgb, var(--dc-success) 10%, transparent);
      border: 1px solid var(--dc-success);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-success);
      margin-bottom: var(--dc-space-lg);

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly store = inject(CatalogStore);

  // Import modal state
  readonly showImportModal = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly conflictStrategy = signal<ConflictStrategy>(ConflictStrategy.Replace);
  readonly isDragOver = signal(false);
  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);
  readonly importSuccess = signal(false);

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

  // Import Modal Methods
  openImportModal(): void {
    this.showImportModal.set(true);
    this.selectedFile.set(null);
    this.importError.set(null);
    this.importSuccess.set(false);
  }

  closeImportModal(): void {
    this.showImportModal.set(false);
    this.selectedFile.set(null);
    this.importError.set(null);
    this.importSuccess.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile.set(input.files[0]);
      this.importError.set(null);
      this.importSuccess.set(false);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        this.selectedFile.set(file);
        this.importError.set(null);
        this.importSuccess.set(false);
      } else {
        this.importError.set('Please select a CSV file');
      }
    }
  }

  onStrategyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.conflictStrategy.set(select.value as ConflictStrategy);
  }

  async onImport(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.importing.set(true);
    this.importError.set(null);
    this.importSuccess.set(false);

    const result = await this.store.importCatalogEntries(file, this.conflictStrategy());

    this.importing.set(false);

    if (result.success) {
      this.importSuccess.set(true);
      setTimeout(() => this.closeImportModal(), 1500);
    } else {
      this.importError.set(result.error || 'Import failed');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onExportAll(): void {
    this.store.exportCatalogEntries();
  }
}

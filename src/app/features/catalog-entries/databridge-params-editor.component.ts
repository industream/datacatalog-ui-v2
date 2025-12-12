import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataType } from '@industream/timeseries-client/dto';
import { TimeseriesClient } from '@industream/timeseries-client';
import type { SourceConnection } from '@industream/datacatalog-client/dto';
import type { Database, Dataset } from '@industream/timeseries-client/dto';
import { ToastService } from '../../core/services/toast.service';

interface DataBridgeParams {
  database: string;
  dataset: string;
  column: string;
}

@Component({
  selector: 'app-databridge-params-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="databridge-editor">
      <!-- Mode Switch -->
      <div class="mode-switch">
        <button
          class="mode-btn"
          [class.active]="mode() === 'referenced'"
          (click)="mode.set('referenced')"
        >
          Referenced
        </button>
        <button
          class="mode-btn"
          [class.active]="mode() === 'raw'"
          (click)="mode.set('raw')"
        >
          Raw
        </button>
      </div>

      <!-- Raw Mode -->
      @if (mode() === 'raw') {
        <div class="raw-mode">
          <div class="field">
            <label>Database *</label>
            <input
              type="text"
              [(ngModel)]="rawDatabase"
              (ngModelChange)="onRawChange()"
              placeholder="Enter database name..."
            />
          </div>

          <div class="field">
            <label>Dataset *</label>
            <input
              type="text"
              [(ngModel)]="rawDataset"
              (ngModelChange)="onRawChange()"
              placeholder="Enter dataset name..."
            />
          </div>

          <div class="field">
            <label>Column *</label>
            <input
              type="text"
              [(ngModel)]="rawColumn"
              (ngModelChange)="onRawChange()"
              placeholder="Enter column name..."
            />
          </div>

          <div class="field">
            <label>Data Type *</label>
            <select [(ngModel)]="rawDataType" (ngModelChange)="onRawChange()">
              <option [value]="DataType.String">String</option>
              <option [value]="DataType.Bool">Boolean</option>
              <option [value]="DataType.Int32">Int32</option>
              <option [value]="DataType.Int64">Int64</option>
              <option [value]="DataType.Float32">Float32</option>
              <option [value]="DataType.Float64">Float64</option>
            </select>
          </div>
        </div>
      }

      <!-- Referenced Mode -->
      @if (mode() === 'referenced') {
        <div class="referenced-mode">
          <!-- Database Selection -->
          <div class="field">
            <label>Database *</label>
            @if (loadingDatabases()) {
              <div class="loading">Loading databases...</div>
            } @else if (databasesError()) {
              <div class="error">{{ databasesError() }}</div>
            } @else {
              <select
                [(ngModel)]="selectedDatabase"
                (ngModelChange)="onDatabaseChange()"
              >
                <option value="">Choose database...</option>
                @for (db of databases(); track db.name) {
                  <option [value]="db.name">{{ db.name }}</option>
                }
              </select>
            }
          </div>

          <!-- Dataset Selection -->
          @if (selectedDatabase) {
            <div class="field">
              <label>Dataset *</label>
              @if (loadingDatasets()) {
                <div class="loading">Loading datasets...</div>
              } @else if (datasetsError()) {
                <div class="error">{{ datasetsError() }}</div>
              } @else {
                <select
                  [(ngModel)]="selectedDataset"
                  (ngModelChange)="onDatasetChange()"
                >
                  <option value="">Choose dataset...</option>
                  @for (ds of datasets(); track ds.name) {
                    <option [value]="ds.name">{{ ds.name }}</option>
                  }
                </select>
              }
            </div>
          }

          <!-- Column Selection -->
          @if (selectedDataset) {
            <div class="field">
              <label>Column (non-indexed) *</label>
              @if (nonIndexedColumns().length === 0) {
                <div class="warning">No non-indexed columns available</div>
              } @else {
                <select
                  [(ngModel)]="selectedColumn"
                  (ngModelChange)="onColumnChange()"
                >
                  <option value="">Choose column...</option>
                  @for (col of nonIndexedColumns(); track col.name) {
                    <option [value]="col.name">
                      {{ col.name }} ({{ getDataTypeName(col.type) }})
                    </option>
                  }
                </select>
              }
            </div>
          }

          @if (selectedColumn) {
            <div class="info-box">
              <strong>Selected:</strong> {{ selectedDatabase }} / {{ selectedDataset }} / {{ selectedColumn }}
              <br />
              <strong>Data Type:</strong> {{ getDataTypeName(selectedColumnDataType()) }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .databridge-editor {
        padding: 1rem;
        background: var(--dc-bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--dc-border);
      }

      /* Mode Switch */
      .mode-switch {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.25rem;
        background: var(--dc-bg-primary);
        border-radius: 6px;
        width: fit-content;
      }

      .mode-btn {
        padding: 0.5rem 1rem;
        background: transparent;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--dc-text-secondary);
      }

      .mode-btn:hover {
        color: var(--dc-text-primary);
      }

      .mode-btn.active {
        background: var(--dc-primary);
        color: white;
      }

      /* Fields */
      .field {
        margin-bottom: 1rem;
      }

      .field label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .field input,
      .field select {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid var(--dc-border);
        border-radius: 6px;
        background: var(--dc-bg-primary);
        color: var(--dc-text-primary);
        font-size: 0.9rem;
        font-family: inherit;
      }

      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      /* States */
      .loading {
        padding: 0.75rem;
        background: rgba(33, 150, 243, 0.1);
        border-left: 3px solid #2196f3;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .error {
        padding: 0.75rem;
        background: rgba(244, 67, 54, 0.1);
        border-left: 3px solid #f44336;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #f44336;
      }

      .warning {
        padding: 0.75rem;
        background: rgba(255, 152, 0, 0.1);
        border-left: 3px solid #ff9800;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #ff9800;
      }

      .info-box {
        padding: 0.75rem;
        background: rgba(76, 175, 80, 0.1);
        border-left: 3px solid #4caf50;
        border-radius: 4px;
        font-size: 0.875rem;
        margin-top: 1rem;
      }
    `,
  ],
})
export class DataBridgeParamsEditorComponent {
  // Inputs
  sourceConnection = input.required<SourceConnection>();
  initialParams = input<Record<string, string>>({});
  initialDataType = input<DataType>(DataType.String);

  // Outputs
  paramsChange = output<DataBridgeParams>();
  dataTypeChange = output<DataType>();

  // Expose DataType enum to template
  readonly DataType = DataType;

  // Mode
  mode = signal<'raw' | 'referenced'>('referenced');

  // Raw mode
  rawDatabase = '';
  rawDataset = '';
  rawColumn = '';
  rawDataType: DataType = DataType.String;

  // Assisted mode
  databases = signal<Database[]>([]);
  datasets = signal<Dataset[]>([]);
  loadingDatabases = signal(false);
  loadingDatasets = signal(false);
  databasesError = signal<string | null>(null);
  datasetsError = signal<string | null>(null);

  selectedDatabase = '';
  selectedDataset = '';
  selectedColumn = '';

  currentDataset = computed(() =>
    this.datasets().find((ds) => ds.name === this.selectedDataset)
  );

  nonIndexedColumns = computed(() => {
    const dataset = this.currentDataset();
    return dataset ? dataset.columns.filter((col) => !col.indexed) : [];
  });

  selectedColumnDataType = computed(() => {
    const col = this.nonIndexedColumns().find((c) => c.name === this.selectedColumn);
    return col?.type ?? DataType.String;
  });

  private tsClient: TimeseriesClient | null = null;
  private toastService = inject(ToastService);

  constructor() {
    // Load databases when source connection changes
    effect(() => {
      const conn = this.sourceConnection();
      const url = (conn as any)?.url; // SourceConnection has url as index signature
      if (url && typeof url === 'string' && this.mode() === 'referenced') {
        this.loadDatabases(url).then(() => {
          // After databases are loaded, initialize from params if in edit mode
          const params = this.initialParams();
          if (params['database']) {
            const databaseExists = this.databases().some(db => db.name === params['database']);

            if (!databaseExists) {
              this.fallbackToRawMode('Database not found',
                `The database "${params['database']}" could not be found in the timeseries server.`);
              return;
            }

            this.selectedDatabase = params['database'];
            // Load datasets for the selected database
            if (this.selectedDatabase && this.tsClient) {
              this.loadDatasets(this.selectedDatabase).then(() => {
                // After datasets are loaded, validate dataset exists
                if (params['dataset']) {
                  const datasetExists = this.datasets().some(ds => ds.name === params['dataset']);

                  if (!datasetExists) {
                    this.fallbackToRawMode('Dataset not found',
                      `The dataset "${params['dataset']}" could not be found in database "${params['database']}".`);
                    return;
                  }

                  this.selectedDataset = params['dataset'];
                  // Set column if provided
                  if (params['column']) {
                    const columnExists = this.nonIndexedColumns().some(col => col.name === params['column']);

                    if (!columnExists) {
                      this.fallbackToRawMode('Column not found',
                        `The column "${params['column']}" could not be found in dataset "${params['dataset']}".`);
                      return;
                    }

                    this.selectedColumn = params['column'];
                  }
                }
              });
            }
          }
        });
      }
    });

    // Initialize raw mode from inputs
    effect(() => {
      const params = this.initialParams();
      if (params['database']) {
        this.rawDatabase = params['database'];
      }
      if (params['dataset']) {
        this.rawDataset = params['dataset'];
      }
      if (params['column']) {
        this.rawColumn = params['column'];
      }
      this.rawDataType = this.initialDataType();
    });
  }

  private fallbackToRawMode(title: string, message: string): void {
    this.mode.set('raw');
    this.toastService.warning(title, message + ' Switched to Raw mode to preserve the existing configuration.');
  }

  private async loadDatabases(url: string): Promise<void> {
    this.loadingDatabases.set(true);
    this.databasesError.set(null);

    try {
      this.tsClient = new TimeseriesClient({ baseUrl: url });
      const result = await this.tsClient.databases.get();
      this.databases.set(result.items);
    } catch (error) {
      this.databasesError.set('Failed to load databases: ' + (error as Error).message);
      this.databases.set([]);
    } finally {
      this.loadingDatabases.set(false);
    }
  }

  private async loadDatasets(databaseName: string): Promise<void> {
    if (!this.tsClient) return;

    this.loadingDatasets.set(true);
    this.datasetsError.set(null);

    try {
      const result = await this.tsClient.datasets.get(databaseName);
      this.datasets.set(result.items);
    } catch (error) {
      this.datasetsError.set('Failed to load datasets: ' + (error as Error).message);
      this.datasets.set([]);
    } finally {
      this.loadingDatasets.set(false);
    }
  }

  async onDatabaseChange(): Promise<void> {
    this.selectedDataset = '';
    this.selectedColumn = '';
    this.datasets.set([]);

    if (!this.selectedDatabase || !this.tsClient) return;

    await this.loadDatasets(this.selectedDatabase);
  }

  onDatasetChange(): void {
    this.selectedColumn = '';
    this.emitAssistedChange();
  }

  onColumnChange(): void {
    this.emitAssistedChange();
    this.dataTypeChange.emit(this.selectedColumnDataType());
  }

  private emitAssistedChange(): void {
    if (this.selectedDatabase && this.selectedDataset && this.selectedColumn) {
      this.paramsChange.emit({
        database: this.selectedDatabase,
        dataset: this.selectedDataset,
        column: this.selectedColumn,
      });
    }
  }

  onRawChange(): void {
    if (this.rawDatabase && this.rawDataset && this.rawColumn) {
      this.paramsChange.emit({
        database: this.rawDatabase,
        dataset: this.rawDataset,
        column: this.rawColumn,
      });
      this.dataTypeChange.emit(this.rawDataType);
    }
  }

  getDataTypeName(dataType: DataType): string {
    const names: Partial<Record<DataType, string>> = {
      [DataType.String]: 'String',
      [DataType.Bool]: 'Boolean',
      [DataType.Int32]: 'Int32',
      [DataType.Int64]: 'Int64',
      [DataType.Float32]: 'Float32',
      [DataType.Float64]: 'Float64',
    };
    return names[dataType] ?? 'Unknown';
  }
}

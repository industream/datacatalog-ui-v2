import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type {
  CatalogEntry,
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest,
  SourceConnection,
  Label,
} from '@industream/datacatalog-client/dto';
import { DataType } from '@industream/datacatalog-client/dto';
import { DataType as TSDataType } from '@industream/timeseries-client/dto';
import { ApiService } from '../../core/services/api.service';
import { SOURCE_TYPE_IDS } from '../../core/constants/source-types';
import { DataBridgeParamsEditorComponent } from './databridge-params-editor.component';

interface Translation {
  locale: string;
  text: string;
}

// Common locales for the dropdown
const COMMON_LOCALES = [
  // French
  { value: 'fr-FR', label: 'French (France) - fr-FR' },
  { value: 'fr-BE', label: 'French (Belgium) - fr-BE' },
  { value: 'fr-CA', label: 'French (Canada) - fr-CA' },
  { value: 'fr-CH', label: 'French (Switzerland) - fr-CH' },

  // English
  { value: 'en-US', label: 'English (United States) - en-US' },
  { value: 'en-GB', label: 'English (United Kingdom) - en-GB' },
  { value: 'en-CA', label: 'English (Canada) - en-CA' },
  { value: 'en-AU', label: 'English (Australia) - en-AU' },

  // Dutch
  { value: 'nl-NL', label: 'Dutch (Netherlands) - nl-NL' },
  { value: 'nl-BE', label: 'Dutch (Belgium) - nl-BE' },

  // German
  { value: 'de-DE', label: 'German (Germany) - de-DE' },
  { value: 'de-AT', label: 'German (Austria) - de-AT' },
  { value: 'de-CH', label: 'German (Switzerland) - de-CH' },

  // Spanish
  { value: 'es-ES', label: 'Spanish (Spain) - es-ES' },
  { value: 'es-MX', label: 'Spanish (Mexico) - es-MX' },
  { value: 'es-AR', label: 'Spanish (Argentina) - es-AR' },

  // Italian
  { value: 'it-IT', label: 'Italian (Italy) - it-IT' },
  { value: 'it-CH', label: 'Italian (Switzerland) - it-CH' },

  // Portuguese
  { value: 'pt-PT', label: 'Portuguese (Portugal) - pt-PT' },
  { value: 'pt-BR', label: 'Portuguese (Brazil) - pt-BR' },

  // Other
  { value: 'pl-PL', label: 'Polish (Poland) - pl-PL' },
  { value: 'ru-RU', label: 'Russian (Russia) - ru-RU' },
  { value: 'zh-CN', label: 'Chinese (China) - zh-CN' },
  { value: 'ja-JP', label: 'Japanese (Japan) - ja-JP' },
  { value: 'ko-KR', label: 'Korean (Korea) - ko-KR' },
];

interface MetadataField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'translation';
  value: string | number | boolean | Translation[];
}

interface SourceParam {
  key: string;
  value: string;
}

@Component({
  selector: 'app-catalog-entry-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DataBridgeParamsEditorComponent],
  template: `
    <div class="modal-backdrop" [class.active]="isOpen()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h2>{{ editEntry() ? 'Edit Catalog Entry' : 'New Catalog Entry' }}</h2>
          <button class="close-btn" (click)="close()">×</button>
        </div>

        <div class="modal-body">
          <!-- Name -->
          <div class="field">
            <label>Entry Name *</label>
            <input
              type="text"
              [(ngModel)]="entryName"
              placeholder="Enter name..."
            />
          </div>

          <!-- Source Connection -->
          <div class="field">
            <label>Source Connection *</label>
            <select
              [value]="selectedSourceConnectionId() ?? ''"
              (change)="onSourceConnectionChange($event)"
            >
              <option value="">Choose source...</option>
              @for (conn of sourceConnections(); track conn.id) {
                <option [value]="conn.id">{{ conn.name }} ({{ conn.sourceType.name }})</option>
              }
            </select>
          </div>

          @if (selectedSourceConnection()) {
            @if (isDataBridgeSource()) {
              <!-- DataBridge Source Parameters & DataType -->
              <div class="section">
                <h3>DataBridge Configuration</h3>
                <app-databridge-params-editor
                  [sourceConnection]="selectedSourceConnection()!"
                  [initialParams]="getSourceParamsAsRecord()"
                  [initialDataType]="convertToTSDataType(selectedDataType)"
                  (paramsChange)="onDataBridgeParamsChange($event)"
                  (dataTypeChange)="onDataBridgeDataTypeChange($event)"
                />
              </div>

              <div class="divider"></div>
            } @else {
              <!-- Regular Data Type (non-DataBridge) -->
              <div class="field">
                <label>Data Type *</label>
                <select [(ngModel)]="selectedDataType" (ngModelChange)="onDataTypeChange($event)">
                  <option [value]="DataType.String">String</option>
                  <option [value]="DataType.Bool">Boolean</option>
                  <option [value]="DataType.Int32">Int32</option>
                  <option [value]="DataType.Int64">Int64</option>
                  <option [value]="DataType.Float32">Float32</option>
                  <option [value]="DataType.Float64">Float64</option>
                </select>
              </div>

              <div class="divider"></div>

              <!-- Regular Source Parameters (non-DataBridge) -->
              <div class="section">
                <div class="section-header">
                  <h3>Source Parameters</h3>
                  <button class="add-btn" (click)="addSourceParam()">+ Add</button>
                </div>

                @if (sourceParams().length === 0) {
                  <p class="empty">No parameters defined</p>
                } @else {
                  <div class="params-list">
                    @for (param of sourceParams(); track $index) {
                      <div class="param-item">
                        <input
                          type="text"
                          [(ngModel)]="param.key"
                          placeholder="Key"
                          class="param-input key"
                        />
                        <span class="separator">→</span>
                        <input
                          type="text"
                          [(ngModel)]="param.value"
                          placeholder="Value"
                          class="param-input value"
                        />
                        <button class="delete-btn" (click)="removeSourceParam($index)">×</button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="divider"></div>
            }

            <!-- Labels - New Pretty UI -->
            <div class="section">
              <h3>Labels</h3>
              @if (labels().length === 0) {
                <p class="empty">No labels available</p>
              } @else {
                <div class="label-grid">
                  @for (label of labels(); track label.id) {
                    <div
                      class="label-chip"
                      [class.selected]="selectedLabelIds().includes(label.id)"
                      (click)="toggleLabel(label.id)"
                    >
                      <div class="label-chip-content">
                        <span class="label-name">{{ label.name }}</span>
                        @if (selectedLabelIds().includes(label.id)) {
                          <span class="check-icon">✓</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="divider"></div>

            <!-- Metadata -->
            <div class="section">
              <div class="section-header">
                <h3>Metadata</h3>
                <button class="add-btn" (click)="addMetadataField()">+ Add</button>
              </div>

              @if (metadataFields().length === 0) {
                <p class="empty">No metadata defined</p>
              } @else {
                <div class="metadata-list">
                  @for (field of metadataFields(); track $index) {
                    <div class="metadata-item">
                      <input
                        type="text"
                        [(ngModel)]="field.key"
                        placeholder="Key"
                        class="meta-key"
                      />
                      <select
                        [value]="field.type"
                        (change)="onMetadataTypeChange($index, $event)"
                        class="meta-type"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Bool</option>
                        <option value="translation">Translation</option>
                      </select>

                      @if (field.type === 'string') {
                        <input
                          type="text"
                          [(ngModel)]="field.value"
                          placeholder="Value"
                          class="meta-value"
                        />
                      }
                      @if (field.type === 'number') {
                        <input
                          type="number"
                          [(ngModel)]="field.value"
                          placeholder="0"
                          class="meta-value"
                        />
                      }
                      @if (field.type === 'boolean') {
                        <div class="bool-toggle" (click)="toggleMetadataBoolean($index)">
                          <div class="toggle-switch" [class.on]="field.value">
                            <div class="toggle-knob"></div>
                          </div>
                          <span class="bool-label">{{ field.value ? 'True' : 'False' }}</span>
                        </div>
                      }
                      @if (field.type === 'translation') {
                        <div class="translation-editor">
                          @if (getTranslations(field).length === 0) {
                            <div class="empty-translations">
                              <p>No translations yet</p>
                              <button
                                class="add-translation-btn"
                                (click)="addTranslation($index)"
                              >
                                + Add Translation
                              </button>
                            </div>
                          } @else {
                            <div class="translations-container">
                              <div class="translations-list">
                                @for (trans of getTranslations(field); track $index; let transIndex = $index) {
                                  <div class="translation-item">
                                    <div class="translation-row">
                                      <div class="translation-locale">
                                        <label>Language & Region</label>
                                        <select
                                          [(ngModel)]="trans.locale"
                                          class="locale-select"
                                        >
                                          <option value="">Choose locale...</option>
                                          @for (locale of commonLocales; track locale.value) {
                                            <option [value]="locale.value">{{ locale.label }}</option>
                                          }
                                        </select>
                                      </div>
                                      <div class="translation-text">
                                        <label>Translation</label>
                                        <input
                                          type="text"
                                          [(ngModel)]="trans.text"
                                          placeholder="Enter translation..."
                                          class="translation-text-input"
                                        />
                                      </div>
                                      <button
                                        class="delete-translation-btn"
                                        (click)="removeTranslation($index, transIndex)"
                                        title="Remove translation"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                }
                              </div>
                              <button
                                class="add-translation-btn-compact"
                                (click)="addTranslation($index)"
                              >
                                + Add Another Translation
                              </button>
                            </div>
                          }
                        </div>
                      }

                      <button class="delete-btn" (click)="removeMetadataField($index)">×</button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn secondary" (click)="close()">Cancel</button>
          <button class="btn primary" (click)="save()" [disabled]="!canSave()">
            {{ editEntry() ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Modal */
      .modal-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1000;
        align-items: center;
        justify-content: center;
      }

      .modal-backdrop.active {
        display: flex;
      }

      .modal-content {
        background: var(--dc-bg-primary);
        border-radius: 12px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      /* Header */
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--dc-border);
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.75rem;
        color: var(--dc-text-secondary);
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: var(--dc-bg-hover);
        color: var(--dc-text-primary);
      }

      /* Body */
      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      /* Fields */
      .field {
        margin-bottom: 1.25rem;
      }

      .field label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--dc-text-primary);
      }

      .field input,
      .field select {
        width: 100%;
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--dc-border);
        border-radius: 6px;
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
        font-size: 0.9rem;
        font-family: inherit;
        transition: border-color 0.2s;
      }

      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      /* Divider */
      .divider {
        height: 1px;
        background: var(--dc-border);
        margin: 1.5rem 0;
      }

      /* Sections */
      .section {
        margin-bottom: 1.5rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .section h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .empty {
        color: var(--dc-text-secondary);
        font-size: 0.875rem;
        font-style: italic;
        margin: 0.5rem 0;
      }

      /* Labels Grid - New Pretty UI */
      .label-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .label-chip {
        padding: 0.5rem 0.875rem;
        border: 2px solid var(--dc-border);
        border-radius: 20px;
        background: var(--dc-bg-secondary);
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      }

      .label-chip:hover {
        border-color: var(--dc-primary);
        background: var(--dc-bg-hover);
      }

      .label-chip.selected {
        border-color: var(--dc-primary);
        background: var(--dc-primary);
        color: white;
      }

      .label-chip-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .label-name {
        font-size: 0.875rem;
        font-weight: 500;
      }

      .check-icon {
        font-size: 0.75rem;
        font-weight: bold;
      }

      /* DataBridge Info */
      .databridge-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(33, 150, 243, 0.1);
        border-left: 3px solid #2196f3;
        border-radius: 4px;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
      }

      .info-icon {
        font-size: 1rem;
      }

      /* Source Parameters */
      .params-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .param-item {
        display: grid;
        grid-template-columns: 1fr auto 1fr auto;
        gap: 0.5rem;
        align-items: center;
      }

      .param-input {
        padding: 0.5rem;
        border: 1px solid var(--dc-border);
        border-radius: 6px;
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
        font-size: 0.875rem;
      }

      .param-input:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      .separator {
        color: var(--dc-text-secondary);
        font-weight: 500;
      }

      /* Metadata */
      .metadata-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .metadata-item {
        display: grid;
        grid-template-columns: 1.2fr 100px 1.2fr auto;
        gap: 0.5rem;
        align-items: center;
      }

      .meta-key,
      .meta-type,
      .meta-value {
        padding: 0.5rem;
        border: 1px solid var(--dc-border);
        border-radius: 6px;
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
        font-size: 0.875rem;
      }

      .meta-key:focus,
      .meta-type:focus,
      .meta-value:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      /* Boolean Toggle */
      .bool-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .toggle-switch {
        position: relative;
        width: 42px;
        height: 22px;
        background: var(--dc-bg-tertiary);
        border: 2px solid var(--dc-border-strong);
        border-radius: 11px;
        transition: all 0.3s;
      }

      .toggle-switch.on {
        background: var(--dc-primary);
        border-color: var(--dc-primary);
      }

      .toggle-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        background: var(--dc-text-primary);
        border-radius: 50%;
        transition: all 0.3s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-switch.on .toggle-knob {
        transform: translateX(20px);
        background: white;
      }

      .bool-label {
        font-size: 0.875rem;
        min-width: 42px;
        font-weight: 500;
      }

      /* Translation Editor */
      .translation-editor {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 0.5rem;
        padding: 1rem;
        background: var(--dc-bg-primary);
        border-radius: 8px;
        border: 1px solid var(--dc-border);
      }

      .empty-translations {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1.5rem;
        text-align: center;
      }

      .empty-translations p {
        margin: 0;
        color: var(--dc-text-secondary);
        font-size: 0.875rem;
      }

      .translations-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .translations-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .translation-item {
        background: var(--dc-bg-secondary);
        border: 1px solid var(--dc-border);
        border-radius: 8px;
        padding: 1rem;
      }

      .translation-row {
        display: grid;
        grid-template-columns: 1fr 2fr auto;
        gap: 1rem;
        align-items: end;
      }

      .translation-locale,
      .translation-text {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .translation-locale label,
      .translation-text label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--dc-text-secondary);
      }

      .locale-select {
        padding: 0.625rem;
        border: 1px solid var(--dc-border);
        border-radius: 6px;
        background: var(--dc-bg-primary);
        color: var(--dc-text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .locale-select:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      .translation-text-input {
        padding: 0.625rem;
        border: 1px solid var(--dc-border);
        border-radius: 6px;
        background: var(--dc-bg-primary);
        color: var(--dc-text-primary);
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .translation-text-input:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      .delete-translation-btn {
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        color: var(--dc-text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        margin-bottom: 0.25rem;
      }

      .delete-translation-btn:hover {
        color: #f44336;
        background: rgba(244, 67, 54, 0.1);
      }

      .add-translation-btn,
      .add-translation-btn-compact {
        padding: 0.625rem 1rem;
        background: var(--dc-bg-secondary);
        color: var(--dc-primary);
        border: 1px solid var(--dc-primary);
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        width: fit-content;
      }

      .add-translation-btn:hover,
      .add-translation-btn-compact:hover {
        background: var(--dc-primary);
        color: white;
      }

      .add-translation-btn-compact {
        align-self: flex-start;
      }

      /* Buttons */
      .add-btn {
        padding: 0.375rem 0.75rem;
        background: var(--dc-primary);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .add-btn:hover {
        background: var(--dc-primary-hover);
      }

      .delete-btn {
        width: 28px;
        height: 28px;
        background: none;
        border: none;
        color: var(--dc-text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .delete-btn:hover {
        background: var(--dc-danger, #f44336);
        color: white;
      }

      /* Footer */
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        border-top: 1px solid var(--dc-border);
      }

      .btn {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn.primary {
        background: var(--dc-primary);
        color: white;
      }

      .btn.primary:hover:not(:disabled) {
        background: var(--dc-primary-hover);
      }

      .btn.secondary {
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
        border: 1px solid var(--dc-border);
      }

      .btn.secondary:hover {
        background: var(--dc-bg-hover);
      }
    `,
  ],
})
export class CatalogEntryEditorComponent {
  private api = inject(ApiService);

  readonly DataType = DataType;
  readonly commonLocales = COMMON_LOCALES;

  isOpen = signal(false);
  editEntry = signal<CatalogEntry | null>(null);

  sourceConnections = signal<SourceConnection[]>([]);
  labels = signal<Label[]>([]);

  selectedSourceConnectionId = signal<string | null>(null);
  selectedSourceConnection = computed(
    () =>
      this.sourceConnections().find((c) => c.id === this.selectedSourceConnectionId()) ?? null,
  );

  selectedDataType: DataType = DataType.String;
  entryName = '';
  selectedLabelIds = signal<string[]>([]);
  sourceParams = signal<SourceParam[]>([]);
  metadataFields = signal<MetadataField[]>([]);

  constructor() {
    this.api.getSourceConnections().subscribe((connections) => {
      this.sourceConnections.set(connections);
    });

    this.api.getLabels().subscribe((labels) => {
      this.labels.set(labels);
    });
  }

  open(entry?: CatalogEntry): void {
    this.editEntry.set(entry ?? null);
    this.isOpen.set(true);

    if (entry) {
      this.entryName = entry.name;
      this.selectedSourceConnectionId.set(entry.sourceConnection.id);
      this.selectedDataType = entry.dataType;
      this.selectedLabelIds.set(entry.labels?.map((l) => l.id) ?? []);

      // Convert sourceParams to array
      const params: SourceParam[] = [];
      if (entry.sourceParams) {
        for (const [key, value] of Object.entries(entry.sourceParams)) {
          params.push({ key, value: String(value) });
        }
      }
      this.sourceParams.set(params);

      // Convert metadata to array
      const fields: MetadataField[] = [];
      if (entry.metadata) {
        for (const [key, value] of Object.entries(entry.metadata)) {
          // Check if value is a translation object (plain object with string values)
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const isTranslation = Object.values(value).every((v) => typeof v === 'string');
            if (isTranslation) {
              // Convert { "fr-FR": "text", "en-UK": "text" } to Translation[]
              const translations: Translation[] = Object.entries(value).map(([locale, text]) => ({
                locale,
                text: String(text),
              }));
              fields.push({
                key,
                type: 'translation',
                value: translations,
              });
              continue;
            }
          }

          // Handle other types
          const type =
            typeof value === 'boolean'
              ? 'boolean'
              : typeof value === 'number'
                ? 'number'
                : 'string';
          fields.push({
            key,
            type,
            value: (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string')
              ? value
              : String(value)
          });
        }
      }
      this.metadataFields.set(fields);
    } else {
      this.resetForm();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.entryName = '';
    this.selectedSourceConnectionId.set(null);
    this.selectedDataType = DataType.String;
    this.selectedLabelIds.set([]);
    this.sourceParams.set([]);
    this.metadataFields.set([]);
  }

  onSourceConnectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedSourceConnectionId.set(select.value || null);
  }

  onDataTypeChange(newDataType: DataType): void {
    this.selectedDataType = newDataType;
  }

  isDataBridgeSource(): boolean {
    const sourceType = this.selectedSourceConnection()?.sourceType;
    return sourceType?.id === SOURCE_TYPE_IDS.DATABRIDGE;
  }

  // DataBridge helpers
  getSourceParamsAsRecord(): Record<string, string> {
    const record: Record<string, string> = {};
    for (const param of this.sourceParams()) {
      if (param.key.trim()) {
        record[param.key] = param.value;
      }
    }
    return record;
  }

  convertToTSDataType(dataType: DataType): TSDataType {
    // Map DataCatalog DataType to TimeSeries DataType
    const mapping: Partial<Record<DataType, TSDataType>> = {
      [DataType.String]: TSDataType.String,
      [DataType.Bool]: TSDataType.Bool,
      [DataType.Int32]: TSDataType.Int32,
      [DataType.Int64]: TSDataType.Int64,
      [DataType.Float32]: TSDataType.Float32,
      [DataType.Float64]: TSDataType.Float64,
    };
    return mapping[dataType] ?? TSDataType.String;
  }

  convertFromTSDataType(tsDataType: TSDataType): DataType {
    // Map TimeSeries DataType to DataCatalog DataType
    const mapping: Partial<Record<TSDataType, DataType>> = {
      [TSDataType.String]: DataType.String,
      [TSDataType.Bool]: DataType.Bool,
      [TSDataType.Int32]: DataType.Int32,
      [TSDataType.Int64]: DataType.Int64,
      [TSDataType.Float32]: DataType.Float32,
      [TSDataType.Float64]: DataType.Float64,
    };
    return mapping[tsDataType] ?? DataType.String;
  }

  onDataBridgeParamsChange(params: { database: string; dataset: string; column: string }): void {
    // Update sourceParams with DataBridge params
    this.sourceParams.set([
      { key: 'database', value: params.database },
      { key: 'dataset', value: params.dataset },
      { key: 'column', value: params.column },
    ]);
  }

  onDataBridgeDataTypeChange(tsDataType: TSDataType): void {
    this.selectedDataType = this.convertFromTSDataType(tsDataType);
  }

  // Source Parameters
  addSourceParam(): void {
    this.sourceParams.update((params) => [...params, { key: '', value: '' }]);
  }

  removeSourceParam(index: number): void {
    this.sourceParams.update((params) => params.filter((_, i) => i !== index));
  }

  // Metadata
  addMetadataField(): void {
    this.metadataFields.update((fields) => [
      ...fields,
      { key: '', type: 'string', value: '' },
    ]);
  }

  removeMetadataField(index: number): void {
    this.metadataFields.update((fields) => fields.filter((_, i) => i !== index));
  }

  onMetadataTypeChange(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newType = select.value as 'string' | 'number' | 'boolean' | 'translation';

    this.metadataFields.update((fields) => {
      const updated = [...fields];
      const field = updated[index];
      field.type = newType;

      if (newType === 'boolean') {
        field.value = false;
      } else if (newType === 'number') {
        field.value = 0;
      } else if (newType === 'translation') {
        field.value = [];
      } else {
        field.value = '';
      }

      return updated;
    });
  }

  toggleMetadataBoolean(index: number): void {
    this.metadataFields.update((fields) => {
      const updated = [...fields];
      updated[index].value = !updated[index].value;
      return updated;
    });
  }

  // Translation helpers
  getTranslations(field: MetadataField): Translation[] {
    return Array.isArray(field.value) ? field.value : [];
  }

  addTranslation(fieldIndex: number): void {
    this.metadataFields.update((fields) => {
      const updated = [...fields];
      const field = updated[fieldIndex];
      if (field.type === 'translation') {
        const translations = Array.isArray(field.value) ? field.value : [];
        field.value = [...translations, { locale: '', text: '' }];
      }
      return updated;
    });
  }

  removeTranslation(fieldIndex: number, translationIndex: number): void {
    this.metadataFields.update((fields) => {
      const updated = [...fields];
      const field = updated[fieldIndex];
      if (field.type === 'translation' && Array.isArray(field.value)) {
        field.value = field.value.filter((_, i) => i !== translationIndex);
      }
      return updated;
    });
  }

  // Labels
  toggleLabel(labelId: string): void {
    const current = this.selectedLabelIds();
    if (current.includes(labelId)) {
      this.selectedLabelIds.set(current.filter((id) => id !== labelId));
    } else {
      this.selectedLabelIds.set([...current, labelId]);
    }
  }

  canSave(): boolean {
    return !!(
      this.entryName.trim() &&
      this.selectedSourceConnection() &&
      this.selectedDataType
    );
  }

  save(): void {
    if (!this.canSave()) return;

    // Convert sourceParams array to object
    const sourceParamsObj: Record<string, string> = {};
    for (const param of this.sourceParams()) {
      if (param.key.trim()) {
        sourceParamsObj[param.key] = param.value;
      }
    }

    // Convert metadata array to object
    const metadataObj: Record<string, any> = {};
    for (const field of this.metadataFields()) {
      if (field.key.trim()) {
        if (field.type === 'translation' && Array.isArray(field.value)) {
          // Convert translation array to { locale: text } format
          const translationObj: Record<string, string> = {};
          for (const trans of field.value) {
            if (trans.locale.trim() && trans.text.trim()) {
              translationObj[trans.locale] = trans.text;
            }
          }
          metadataObj[field.key] = translationObj;
        } else {
          metadataObj[field.key] = field.value;
        }
      }
    }

    if (this.editEntry()) {
      const request: CatalogEntryAmendRequest = {
        id: this.editEntry()!.id,
        name: this.entryName,
        sourceConnectionId: this.selectedSourceConnectionId()!,
        sourceParams: sourceParamsObj,
        dataType: this.selectedDataType,
        labelIds: this.selectedLabelIds(),
        metadata: metadataObj,
      };

      this.api.updateCatalogEntries([request]).subscribe(() => {
        this.close();
        window.location.reload();
      });
    } else {
      const request: CatalogEntryCreateRequest = {
        name: this.entryName,
        sourceConnectionId: this.selectedSourceConnectionId()!,
        sourceParams: sourceParamsObj,
        dataType: this.selectedDataType,
        labelIds: this.selectedLabelIds(),
        metadata: metadataObj,
      };

      this.api.createCatalogEntries([request]).subscribe(() => {
        this.close();
        window.location.reload();
      });
    }
  }
}

import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, computed } from '@angular/core';

import '@carbon/web-components/es/components/button/index.js';

import { CatalogStore } from '../../store';
import type { Label } from '@industream/datacatalog-client/dto';

// Color palette for labels (distinct, visible colors)
const LABEL_COLORS = [
  '#0f62fe', // Blue
  '#24a148', // Green
  '#a56eff', // Purple
  '#ff832b', // Orange
  '#d02670', // Magenta
  '#00bab6', // Teal
  '#f1c21b', // Yellow
  '#8a3ffc', // Violet
  '#007d79', // Cyan dark
  '#ba4e00', // Burnt orange
  '#ee538b', // Pink
  '#0072c3', // Blue dark
];

// Default labels to create when none exist
const DEFAULT_LABELS = [
  'Production',
  'Development',
  'Testing',
  'Critical',
  'Archived'
];

// Simple hash function to get consistent color for a label
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getLabelColor(labelName: string): string {
  const index = hashString(labelName) % LABEL_COLORS.length;
  return LABEL_COLORS[index];
}

@Component({
  selector: 'app-labels',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="labels-container">
      <header class="labels-header">
        <div class="header-content">
          <h1>Labels</h1>
          <p class="subtitle">Organize your catalog entries with labels</p>
        </div>
        <cds-button kind="primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          New Label
        </cds-button>
      </header>

      <!-- Filters -->
      @if (store.labels().length > 0) {
        <div class="filters-bar">
          <input
            type="text"
            class="filter-input"
            placeholder="Filter by name..."
            [value]="nameFilter()"
            (input)="onNameFilterChange($event)">
        </div>
      }

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading labels...</p>
        </div>
      } @else if (filteredLabels().length === 0 && store.labels().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">label</span>
          <h2>No labels yet</h2>
          <p>Create labels to categorize and organize your catalog entries</p>
          <cds-button kind="primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            Create Label
          </cds-button>
        </div>
      } @else if (filteredLabels().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">search_off</span>
          <h2>No matching labels</h2>
          <p>Try adjusting your filter</p>
        </div>
      } @else {
        <div class="labels-grid">
          @for (label of filteredLabels(); track label.id) {
            <div class="label-card" [class.editing]="editingLabel()?.id === label.id" [class.selected]="selectedIds().has(label.id)">
              @if (editingLabel()?.id === label.id) {
                <div class="edit-mode">
                  <input
                    type="text"
                    class="label-input"
                    [value]="editName()"
                    (input)="onEditInput($event)"
                    (keydown.enter)="saveEdit()"
                    (keydown.escape)="cancelEdit()">
                  <div class="edit-actions">
                    <button class="icon-btn success" title="Save" (click)="saveEdit()">
                      <span class="material-symbols-outlined">check</span>
                    </button>
                    <button class="icon-btn" title="Cancel" (click)="cancelEdit()">
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              } @else {
                <div class="label-checkbox">
                  <input
                    type="checkbox"
                    [checked]="selectedIds().has(label.id)"
                    (change)="toggleSelect(label.id); $event.stopPropagation()"
                    (click)="$event.stopPropagation()">
                </div>
                <div class="label-content">
                  <span class="label-badge" [style.background]="getLabelColor(label.name)">
                    <span class="material-symbols-outlined">label</span>
                    {{ label.name }}
                  </span>
                  <span class="entry-count">{{ getEntryCount(label.id) }} entries</span>
                </div>
                <div class="label-actions">
                  <button class="icon-btn" title="Edit" (click)="startEdit(label)">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="icon-btn danger" title="Delete" (click)="onDeleteLabel(label)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Usage Statistics -->
        <section class="usage-section">
          <h2>Label Usage</h2>
          <div class="usage-chart">
            @for (stat of labelStats(); track stat.label.id) {
              <div class="usage-item">
                <div class="usage-info">
                  <span class="label-badge small" [style.background]="getLabelColor(stat.label.name)">{{ stat.label.name }}</span>
                  <span class="usage-count">{{ stat.count }} entries</span>
                </div>
                <div class="usage-bar-container">
                  <div
                    class="usage-bar"
                    [style.width.%]="stat.percentage"
                    [style.background]="getLabelColor(stat.label.name)">
                  </div>
                </div>
              </div>
            }
            @if (labelStats().length === 0) {
              <p class="no-usage">No labels are currently in use</p>
            }
          </div>
        </section>
      }

      <!-- Bulk Actions Bar -->
      @if (selectedIds().size > 0) {
        <div class="bulk-actions-bar">
          <span class="selection-count">{{ selectedIds().size }} selected</span>
          <cds-button kind="danger" size="sm" (click)="onBulkDelete()">
            <span class="material-symbols-outlined" slot="icon">delete</span>
            Delete Selected
          </cds-button>
        </div>
      }

      <!-- Create Modal -->
      @if (showCreateModal()) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h2>New Label</h2>
              <button class="icon-btn" (click)="closeCreateModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="label-name">Label Name</label>
                <input
                  type="text"
                  id="label-name"
                  class="form-input"
                  placeholder="Enter label name..."
                  [value]="newLabelName()"
                  (input)="onNewLabelInput($event)"
                  (keydown.enter)="createLabel()">
              </div>
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeCreateModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="createLabel()" [disabled]="!newLabelName().trim()">
                Create
              </cds-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .labels-container {
      padding: var(--dc-space-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    .labels-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--dc-space-xl);

      .header-content {
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
      min-height: 300px;

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

    .labels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--dc-space-md);
      margin-bottom: var(--dc-space-xl);
    }

    .label-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-md) var(--dc-space-lg);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-border-strong);
      }

      &.editing {
        border-color: var(--dc-primary);
      }

      &.selected {
        background: var(--dc-bg-selected);
        border-color: var(--dc-primary);
      }
    }

    .label-checkbox {
      display: flex;
      align-items: center;
      margin-right: var(--dc-space-md);

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
    }

    .label-content {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-xs);
    }

    .label-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--dc-space-xs);
      padding: 4px 12px;
      border-radius: var(--dc-radius-full);
      color: white;
      font-weight: 500;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &.small {
        padding: 2px 8px;
        font-size: 0.875rem;

        .material-symbols-outlined {
          font-size: 14px;
        }
      }
    }

    .entry-count {
      font-size: 0.875rem;
      color: var(--dc-text-secondary);
    }

    .label-actions {
      display: flex;
      gap: 4px;
    }

    .edit-mode {
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      width: 100%;
    }

    .label-input {
      flex: 1;
      padding: 8px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-primary);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;

      &:focus {
        outline: none;
      }
    }

    .edit-actions {
      display: flex;
      gap: 4px;
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

      &.success:hover {
        background: color-mix(in srgb, var(--dc-success) 15%, transparent);
        color: var(--dc-success);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    /* Usage Section */
    .usage-section {
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

    .usage-chart {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-md);
    }

    .usage-item {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-xs);
    }

    .usage-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .usage-count {
      font-size: 0.875rem;
      color: var(--dc-text-secondary);
    }

    .usage-bar-container {
      height: 8px;
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-full);
      overflow: hidden;
    }

    .usage-bar {
      height: 100%;
      border-radius: var(--dc-radius-full);
      transition: width var(--dc-duration-slow) var(--dc-easing-standard);
      min-width: 4px;
    }

    .no-usage {
      color: var(--dc-text-secondary);
      font-style: italic;
      text-align: center;
      padding: var(--dc-space-md);
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
      max-width: 400px;
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
      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--dc-text-secondary);
      }
    }

    .form-input {
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

    /* Filters Bar */
    .filters-bar {
      margin-bottom: var(--dc-space-xl);
      padding: var(--dc-space-md);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
    }

    .filter-input {
      width: 100%;
      padding: 8px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      &::placeholder {
        color: var(--dc-text-secondary);
      }
    }

    /* Bulk Actions Bar */
    .bulk-actions-bar {
      position: fixed;
      bottom: var(--dc-space-lg);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      padding: var(--dc-space-md);
      background: var(--dc-bg-primary);
      border: 1px solid var(--dc-border);
      border-radius: var(--dc-radius-md);
      box-shadow: var(--dc-shadow-lg);
      z-index: 100;

      .selection-count {
        font-weight: 500;
        color: var(--dc-text-primary);
      }
    }
  `]
})
export class LabelsComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly showCreateModal = signal(false);
  readonly newLabelName = signal('');
  readonly editingLabel = signal<Label | null>(null);
  readonly editName = signal('');
  readonly nameFilter = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());
  private defaultLabelsCreated = false;

  readonly filteredLabels = computed(() => {
    const name = this.nameFilter().toLowerCase();
    if (!name) return this.store.labels();
    return this.store.labels().filter(l => l.name.toLowerCase().includes(name));
  });

  readonly labelStats = computed(() => {
    const labels = this.store.labels();
    const entries = this.store.entries();
    const maxCount = Math.max(...labels.map(l => this.getEntryCountForLabel(l.id, entries)), 1);

    return labels
      .map(label => ({
        label,
        count: this.getEntryCountForLabel(label.id, entries),
        percentage: (this.getEntryCountForLabel(label.id, entries) / maxCount) * 100
      }))
      .filter(stat => stat.count > 0)
      .sort((a, b) => b.count - a.count);
  });

  readonly allSelected = computed(() => {
    const labels = this.filteredLabels();
    return labels.length > 0 && labels.every(l => this.selectedIds().has(l.id));
  });

  readonly someSelected = computed(() => {
    const selected = this.selectedIds();
    const labels = this.filteredLabels();
    return labels.some(l => selected.has(l.id)) && !this.allSelected();
  });

  ngOnInit(): void {
    if (this.store.labels().length === 0) {
      this.store.loadAll();
    }
    // Check and create default labels after a short delay to allow data to load
    setTimeout(() => this.checkAndCreateDefaultLabels(), 1000);
  }

  private checkAndCreateDefaultLabels(): void {
    if (this.defaultLabelsCreated) return;
    if (this.store.labels().length === 0 && !this.store.loading()) {
      this.defaultLabelsCreated = true;
      DEFAULT_LABELS.forEach(name => {
        this.store.createLabel({ name });
      });
    }
  }

  getLabelColor(labelName: string): string {
    return getLabelColor(labelName);
  }

  private getEntryCountForLabel(labelId: string, entries: { labels?: { id: string }[] }[]): number {
    return entries.filter(e => e.labels?.some(l => l.id === labelId)).length;
  }

  getEntryCount(labelId: string): number {
    return this.store.entries().filter(e => e.labels?.some(l => l.id === labelId)).length;
  }

  openCreateModal(): void {
    this.newLabelName.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onNewLabelInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newLabelName.set(input.value);
  }

  createLabel(): void {
    const name = this.newLabelName().trim();
    if (!name) return;

    this.store.createLabel({ name });
    this.closeCreateModal();
  }

  startEdit(label: Label): void {
    this.editingLabel.set(label);
    this.editName.set(label.name);
  }

  cancelEdit(): void {
    this.editingLabel.set(null);
    this.editName.set('');
  }

  onEditInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editName.set(input.value);
  }

  onNameFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.nameFilter.set(input.value);
  }

  saveEdit(): void {
    const label = this.editingLabel();
    const name = this.editName().trim();

    if (!label || !name || name === label.name) {
      this.cancelEdit();
      return;
    }

    // Note: API doesn't support label updates, we'd need to delete and recreate
    // For now, just cancel the edit
    alert('Label renaming is not yet supported');
    this.cancelEdit();
  }

  onDeleteLabel(label: Label): void {
    const entryCount = this.getEntryCount(label.id);
    const message = entryCount > 0
      ? `Delete "${label.name}"? This label is used by ${entryCount} entries.`
      : `Delete "${label.name}"?`;

    if (confirm(message)) {
      this.store.deleteLabels([label.id]);
    }
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
      const allIds = this.filteredLabels().map(l => l.id);
      this.selectedIds.set(new Set(allIds));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  onBulkDelete(): void {
    const count = this.selectedIds().size;
    if (confirm(`Delete ${count} labels?`)) {
      this.store.deleteLabels(Array.from(this.selectedIds()));
      this.clearSelection();
    }
  }
}

import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, computed } from '@angular/core';

import '@carbon/web-components/es/components/button/index.js';

import { CatalogStore } from '../../store';
import type { SourceType } from '@industream/datacatalog-client/dto';

@Component({
  selector: 'app-source-types',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="source-types-container">
      <header class="source-types-header">
        <div class="header-content">
          <h1>Source Types</h1>
          <p class="subtitle">Manage available source connection types</p>
        </div>
        <cds-button kind="primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          New Source Type
        </cds-button>
      </header>

      <!-- Filters -->
      @if (store.sourceTypes().length > 0) {
        <div class="filters-bar">
          <input
            type="text"
            class="filter-input"
            placeholder="Filter by name..."
            [value]="nameFilter()"
            (input)="onNameFilterChange($event)">

          <div class="filter-buttons">
            <button
              class="filter-btn"
              [class.active]="protectionFilter() === null"
              (click)="protectionFilter.set(null)">
              All ({{ store.sourceTypes().length }})
            </button>
            <button
              class="filter-btn"
              [class.active]="protectionFilter() === false"
              (click)="protectionFilter.set(false)">
              Non-Protected ({{ countNonProtected() }})
            </button>
            <button
              class="filter-btn"
              [class.active]="protectionFilter() === true"
              (click)="protectionFilter.set(true)">
              Protected ({{ countProtected() }})
            </button>
          </div>
        </div>
      }

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading source types...</p>
        </div>
      } @else if (filteredTypes().length === 0 && store.sourceTypes().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">category</span>
          <h2>No source types</h2>
          <p>Create source types to define available connection types</p>
          <cds-button kind="primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            Create Source Type
          </cds-button>
        </div>
      } @else if (filteredTypes().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">search_off</span>
          <h2>No matching source types</h2>
          <p>Try adjusting your filters</p>
        </div>
      } @else {
        <div class="types-grid">
          @for (type of filteredTypes(); track type.id) {
            <div class="type-card" [class.editing]="editingType()?.id === type.id" [class.protected]="type.isProtected" [class.selected]="selectedIds().has(type.id)">
              @if (editingType()?.id === type.id && !type.isProtected) {
                <div class="edit-mode">
                  <input
                    type="text"
                    class="type-input"
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
                @if (!type.isProtected) {
                  <div class="type-checkbox">
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(type.id)"
                      (change)="toggleSelect(type.id); $event.stopPropagation()"
                      (click)="$event.stopPropagation()">
                  </div>
                }
                <div class="type-content">
                  <div class="type-header">
                    <span class="type-name" [style]="type.isProtected ? 'color: var(--dc-warning);' : ''">
                      {{ type.name }}
                    </span>
                    <span class="type-id">id: {{ type.id }}</span>
                  </div>
                  <span class="connection-count">{{ getConnectionCount(type.id) }} connections</span>
                </div>
                <div class="type-actions">
                  @if (!type.isProtected) {
                    <button class="icon-btn" title="Edit" (click)="startEdit(type)">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="icon-btn danger" title="Delete" (click)="onDeleteType(type)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  } @else {
                    <div class="protected-icon-container" title="Protected - Cannot be modified or deleted">
                      <span class="material-symbols-outlined">lock</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
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
              <h2>New Source Type</h2>
              <button class="icon-btn" (click)="closeCreateModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="type-name">Source Type Name</label>
                <input
                  type="text"
                  id="type-name"
                  class="form-input"
                  placeholder="Enter source type name..."
                  [value]="newTypeName()"
                  (input)="onNewTypeInput($event)"
                  (keydown.enter)="createType()">
              </div>
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeCreateModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="createType()" [disabled]="!newTypeName().trim()">
                Create
              </cds-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .source-types-container {
      padding: var(--dc-space-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    .source-types-header {
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

    .types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--dc-space-md);
    }

    .type-card {
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

      &.protected {
        background: color-mix(in srgb, var(--dc-bg-secondary) 95%, var(--dc-warning) 5%);
      }

      &.selected {
        background: var(--dc-bg-selected);
        border-color: var(--dc-primary);
      }
    }

    .type-checkbox {
      display: flex;
      align-items: center;
      margin-right: var(--dc-space-md);

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
    }

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

    .type-content {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-xs);
      flex: 1;
    }

    .type-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .type-name {
      display: flex;
      align-items: center;
      gap: var(--dc-space-xs);
      font-size: 1rem;
      font-weight: 600;
      color: var(--dc-text-primary);
    }

    .protected-icon {
      font-size: 18px;
      color: var(--dc-warning);
    }

    .type-id {
      font-size: 0.75rem;
      color: var(--dc-text-secondary);
      font-family: monospace;
    }

    .connection-count {
      font-size: 0.875rem;
      color: var(--dc-text-secondary);
    }

    .type-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .protected-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: var(--dc-warning);
      cursor: default;

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .edit-mode {
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      width: 100%;
    }

    .type-input {
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
      display: flex;
      gap: var(--dc-space-md);
      margin-bottom: var(--dc-space-xl);
      padding: var(--dc-space-md);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-input {
      flex: 1;
      min-width: 200px;
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

    .filter-buttons {
      display: flex;
      gap: var(--dc-space-xs);
    }

    .filter-btn {
      padding: 6px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-border-strong);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--dc-primary);
        border-color: var(--dc-primary);
        color: white;
      }
    }
  `]
})
export class SourceTypesComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly showCreateModal = signal(false);
  readonly newTypeName = signal('');
  readonly editingType = signal<SourceType | null>(null);
  readonly editName = signal('');
  readonly nameFilter = signal('');
  readonly protectionFilter = signal<boolean | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly filteredTypes = computed(() => {
    let types = this.store.sourceTypes();
    const name = this.nameFilter().toLowerCase();
    const protection = this.protectionFilter();

    if (name) {
      types = types.filter(t => t.name.toLowerCase().includes(name));
    }

    if (protection !== null) {
      types = types.filter(t => t.isProtected === protection);
    }

    return types;
  });

  readonly countProtected = computed(() =>
    this.store.sourceTypes().filter(t => t.isProtected).length
  );

  readonly countNonProtected = computed(() =>
    this.store.sourceTypes().filter(t => !t.isProtected).length
  );

  readonly allSelected = computed(() => {
    const types = this.filteredTypes().filter(t => !t.isProtected);
    return types.length > 0 && types.every(t => this.selectedIds().has(t.id));
  });

  readonly someSelected = computed(() => {
    const selected = this.selectedIds();
    const types = this.filteredTypes().filter(t => !t.isProtected);
    return types.some(t => selected.has(t.id)) && !this.allSelected();
  });

  ngOnInit(): void {
    if (this.store.sourceTypes().length === 0) {
      this.store.loadAll();
    }
  }

  onNameFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.nameFilter.set(input.value);
  }

  getConnectionCount(typeId: string): number {
    return this.store.sourceConnections().filter(c => c.sourceType?.id === typeId).length;
  }

  openCreateModal(): void {
    this.newTypeName.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onNewTypeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newTypeName.set(input.value);
  }

  createType(): void {
    const name = this.newTypeName().trim();
    if (!name) return;

    this.store.createSourceType({ name });
    this.closeCreateModal();
  }

  startEdit(type: SourceType): void {
    if (type.isProtected) return;
    this.editingType.set(type);
    this.editName.set(type.name);
  }

  cancelEdit(): void {
    this.editingType.set(null);
    this.editName.set('');
  }

  onEditInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editName.set(input.value);
  }

  saveEdit(): void {
    const type = this.editingType();
    const name = this.editName().trim();

    if (!type || !name || name === type.name || type.isProtected) {
      this.cancelEdit();
      return;
    }

    this.store.updateSourceType({ id: type.id, name });
    this.cancelEdit();
  }

  onDeleteType(type: SourceType): void {
    if (type.isProtected) {
      alert(`Cannot delete "${type.name}". This is a protected source type.`);
      return;
    }

    const connectionCount = this.getConnectionCount(type.id);
    if (connectionCount > 0) {
      alert(`Cannot delete "${type.name}". It has ${connectionCount} source connections.`);
      return;
    }

    if (confirm(`Delete "${type.name}"?`)) {
      this.store.deleteSourceTypes([type.id]);
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
      const allIds = this.filteredTypes().filter(t => !t.isProtected).map(t => t.id);
      this.selectedIds.set(new Set(allIds));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  onBulkDelete(): void {
    const count = this.selectedIds().size;
    const types = this.store.sourceTypes().filter(t => this.selectedIds().has(t.id));

    // Check if any selected types have connections
    const typesWithConnections = types.filter(t => this.getConnectionCount(t.id) > 0);
    if (typesWithConnections.length > 0) {
      const names = typesWithConnections.map(t => t.name).join(', ');
      alert(`Cannot delete source types with connections: ${names}`);
      return;
    }

    if (confirm(`Delete ${count} source types?`)) {
      this.store.deleteSourceTypes(Array.from(this.selectedIds()));
      this.clearSelection();
    }
  }
}

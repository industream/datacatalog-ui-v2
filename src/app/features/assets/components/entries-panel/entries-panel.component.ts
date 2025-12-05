import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogEntry, Label } from '../../../../core/models';
import { EntryItemComponent } from '../entry-item/entry-item.component';
import { SelectionBarComponent } from '../selection-bar/selection-bar.component';
import { LabelFilterComponent } from '../label-filter/label-filter.component';

export interface EntryDragStartEvent {
  event: DragEvent;
  entry: CatalogEntry;
  fromAssigned: boolean;
}

export interface EntrySelectEvent {
  event: MouseEvent;
  entry: CatalogEntry;
}

@Component({
  selector: 'app-entries-panel',
  standalone: true,
  imports: [
    CommonModule,
    EntryItemComponent,
    SelectionBarComponent,
    LabelFilterComponent
  ],
  template: `
    <div class="tags-panel">
      <div class="panel-header">
        <h2>Catalog Entries</h2>
        <div class="filter-controls">
          <input
            type="text"
            class="search-input"
            placeholder="Search entries..."
            [value]="searchQuery"
            (input)="onSearchInput($event)">
        </div>
      </div>

      <!-- Label Filter -->
      <app-label-filter
        [labels]="labels"
        [selectedLabelId]="selectedLabelId"
        (labelSelect)="labelSelect.emit($event)">
      </app-label-filter>

      <div class="tags-container">
        @if (selectedNodeName) {
          <div class="assigned-section">
            <h3>
              <span class="material-symbols-outlined">check_circle</span>
              Assigned to "{{ selectedNodeName }}"
              <span class="count-badge">{{ assignedEntries.length }}</span>
            </h3>
            <div class="entries-list assigned"
                 (dragover)="onDragOver($event)"
                 (drop)="dropEntry.emit($event)">
              @if (assignedEntries.length === 0) {
                <p class="empty-hint">Drag entries here or double-click to assign</p>
              } @else {
                @for (entry of assignedEntries; track entry.id) {
                  <app-entry-item
                    [entry]="entry"
                    [isAssigned]="true"
                    (remove)="unassign.emit($event)"
                    (dragStart)="entryDragStart.emit({ event: $event.event, entry: $event.entry, fromAssigned: true })">
                  </app-entry-item>
                }
              }
            </div>
          </div>
        }

        <div class="available-section">
          <h3>
            <span class="material-symbols-outlined">inventory_2</span>
            Available Entries
            <span class="count-badge">{{ availableEntries.length }}</span>
          </h3>

          <div class="help-hint">
            <span class="material-symbols-outlined">info</span>
            <span><kbd>Ctrl</kbd>+Click for multi-select, <kbd>Shift</kbd>+Click for range. Drag & drop to assign.</span>
          </div>

          <!-- Selection bar -->
          @if (selectedCount > 0) {
            <app-selection-bar
              [count]="selectedCount"
              [showAssignButton]="!!selectedNodeName"
              (assign)="assignSelected.emit()"
              (clear)="clearSelection.emit()">
            </app-selection-bar>
          }

          <div class="entries-list">
            @for (entry of availableEntries; track entry.id) {
              <app-entry-item
                [entry]="entry"
                [isInOtherNode]="isInOtherNode(entry)"
                [isSelected]="isEntrySelected(entry.id)"
                [showCheckbox]="true"
                [otherNodesNames]="getNodesForEntry(entry)"
                (select)="entrySelect.emit({ event: $event.event, entry: $event.entry })"
                (doubleClick)="assignEntry.emit($event)"
                (checkboxChange)="toggleSelection.emit($event.id)"
                (dragStart)="entryDragStart.emit({ event: $event.event, entry: $event.entry, fromAssigned: false })">
              </app-entry-item>
            } @empty {
              <p class="empty-hint">No entries match your filters</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tags-panel {
      display: flex;
      flex-direction: column;
      background: var(--dc-bg-secondary);
      border-radius: var(--dc-radius-lg);
      overflow: hidden;
      height: 100%;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--dc-space-md);
      padding: var(--dc-space-md);
      border-bottom: 1px solid var(--dc-border-subtle);

      h2 {
        margin: 0;
        font-size: var(--dc-text-size-md);
        font-weight: 600;
        color: var(--dc-text-primary);
        white-space: nowrap;
      }
    }

    .filter-controls {
      flex: 1;
      display: flex;
      justify-content: flex-end;
    }

    .search-input {
      width: 200px;
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      color: var(--dc-text-primary);
      font-size: var(--dc-text-size-sm);

      &::placeholder {
        color: var(--dc-text-tertiary);
      }

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }
    }

    .tags-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--dc-space-md);
    }

    .assigned-section,
    .available-section {
      h3 {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
        margin: 0 0 var(--dc-space-sm);
        font-size: var(--dc-text-size-sm);
        font-weight: 600;
        color: var(--dc-text-secondary);

        .material-symbols-outlined {
          font-size: 18px;
        }

        .count-badge {
          background: var(--dc-bg-tertiary);
          padding: 2px 8px;
          border-radius: var(--dc-radius-full);
          font-size: 11px;
          font-weight: 500;
        }
      }
    }

    .assigned-section {
      margin-bottom: var(--dc-space-lg);
      padding-bottom: var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);

      h3 .material-symbols-outlined {
        color: var(--dc-success);
      }
    }

    .entries-list {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      &.assigned {
        background: color-mix(in srgb, var(--dc-primary) 5%, transparent);
        border: 2px dashed var(--dc-border-subtle);
        border-radius: var(--dc-radius-md);
        padding: var(--dc-space-sm);
      }
    }

    .empty-hint {
      text-align: center;
      padding: var(--dc-space-lg);
      color: var(--dc-text-tertiary);
      font-size: var(--dc-text-size-sm);
    }

    .help-hint {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: color-mix(in srgb, var(--dc-info) 10%, transparent);
      border-radius: var(--dc-radius-md);
      font-size: 12px;
      color: var(--dc-text-secondary);
      margin-bottom: var(--dc-space-sm);

      .material-symbols-outlined {
        font-size: 16px;
        color: var(--dc-info);
      }

      kbd {
        background: var(--dc-bg-tertiary);
        padding: 1px 5px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 11px;
      }
    }
  `]
})
export class EntriesPanelComponent {
  @Input() searchQuery = '';
  @Input() labels: Label[] = [];
  @Input() selectedLabelId: string | null = null;
  @Input() selectedNodeName: string | null = null;
  @Input() assignedEntries: CatalogEntry[] = [];
  @Input() availableEntries: CatalogEntry[] = [];
  @Input() selectedEntryIds: Set<string> = new Set();
  @Input() nodeEntryMap: Map<string, string[]> = new Map();
  @Input() nodeNameMap: Map<string, string> = new Map();
  @Input() selectedNodeId: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() labelSelect = new EventEmitter<string | null>();
  @Output() entrySelect = new EventEmitter<EntrySelectEvent>();
  @Output() entryDragStart = new EventEmitter<EntryDragStartEvent>();
  @Output() dropEntry = new EventEmitter<DragEvent>();
  @Output() assignEntry = new EventEmitter<CatalogEntry>();
  @Output() unassign = new EventEmitter<CatalogEntry>();
  @Output() assignSelected = new EventEmitter<void>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() toggleSelection = new EventEmitter<string>();

  get selectedCount(): number {
    return this.selectedEntryIds.size;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  isEntrySelected(entryId: string): boolean {
    return this.selectedEntryIds.has(entryId);
  }

  isInOtherNode(entry: CatalogEntry): boolean {
    for (const [nodeId, entryIds] of this.nodeEntryMap.entries()) {
      if (nodeId !== this.selectedNodeId && entryIds.includes(entry.id)) {
        return true;
      }
    }
    return false;
  }

  getNodesForEntry(entry: CatalogEntry): string {
    const nodeNames: string[] = [];
    for (const [nodeId, entryIds] of this.nodeEntryMap.entries()) {
      if (entryIds.includes(entry.id)) {
        const name = this.nodeNameMap.get(nodeId);
        if (name) nodeNames.push(name);
      }
    }
    return nodeNames.join(', ');
  }
}

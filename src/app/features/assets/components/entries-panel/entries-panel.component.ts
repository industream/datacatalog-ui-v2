import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogEntry, Label } from '../../../../core/models';
import { LabelFilterComponent } from '../label-filter/label-filter.component';
import { AssignedEntriesComponent } from '../assigned-entries/assigned-entries.component';
import { AvailableEntriesComponent, AvailableEntrySelectEvent } from '../available-entries/available-entries.component';

export interface EntriesPanelDragEvent {
  event: DragEvent;
  entry: CatalogEntry;
  fromAssigned: boolean;
}

export interface EntriesPanelSelectEvent {
  event: MouseEvent;
  entry: CatalogEntry;
}

@Component({
  selector: 'app-entries-panel',
  standalone: true,
  imports: [
    CommonModule,
    LabelFilterComponent,
    AssignedEntriesComponent,
    AvailableEntriesComponent
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
          <app-assigned-entries
            [nodeName]="selectedNodeName"
            [entries]="assignedEntries"
            (drop)="dropEntry.emit($event)"
            (remove)="unassign.emit($event)"
            (dragStart)="onAssignedDragStart($event)">
          </app-assigned-entries>
        }

        <app-available-entries
          [entries]="availableEntries"
          [loading]="loading"
          [selectedEntryIds]="selectedEntryIds"
          [showAssignButton]="!!selectedNodeName"
          [nodeEntryMap]="nodeEntryMap"
          [nodeNameMap]="nodeNameMap"
          [selectedNodeId]="selectedNodeId"
          (entrySelect)="onAvailableSelect($event)"
          (entryDragStart)="onAvailableDragStart($event)"
          (assignEntry)="assignEntry.emit($event)"
          (assignSelected)="assignSelected.emit()"
          (clearSelection)="clearSelection.emit()"
          (toggleSelection)="toggleSelection.emit($event)">
        </app-available-entries>
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
  `]
})
export class EntriesPanelComponent {
  @Input() searchQuery = '';
  @Input() labels: Label[] = [];
  @Input() selectedLabelId: string | null = null;
  @Input() loading = false;
  @Input() selectedNodeName: string | null = null;
  @Input() assignedEntries: CatalogEntry[] = [];
  @Input() availableEntries: CatalogEntry[] = [];
  @Input() selectedEntryIds: Set<string> = new Set();
  @Input() nodeEntryMap: Map<string, string[]> = new Map();
  @Input() nodeNameMap: Map<string, string> = new Map();
  @Input() selectedNodeId: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() labelSelect = new EventEmitter<string | null>();
  @Output() entrySelect = new EventEmitter<EntriesPanelSelectEvent>();
  @Output() entryDragStart = new EventEmitter<EntriesPanelDragEvent>();
  @Output() dropEntry = new EventEmitter<DragEvent>();
  @Output() assignEntry = new EventEmitter<CatalogEntry>();
  @Output() unassign = new EventEmitter<CatalogEntry>();
  @Output() assignSelected = new EventEmitter<void>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() toggleSelection = new EventEmitter<string>();

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }

  onAssignedDragStart(event: { event: DragEvent; entry: CatalogEntry }): void {
    this.entryDragStart.emit({ ...event, fromAssigned: true });
  }

  onAvailableDragStart(event: { event: DragEvent; entry: CatalogEntry }): void {
    this.entryDragStart.emit({ ...event, fromAssigned: false });
  }

  onAvailableSelect(event: AvailableEntrySelectEvent): void {
    this.entrySelect.emit(event);
  }
}

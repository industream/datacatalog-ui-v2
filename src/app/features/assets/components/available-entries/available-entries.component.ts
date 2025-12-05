import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogEntry } from '../../../../core/models';
import { EntryItemComponent, EntryDragEvent, EntrySelectEvent as EntryItemSelectEvent } from '../entry-item/entry-item.component';
import { SelectionBarComponent } from '../selection-bar/selection-bar.component';
import { SkeletonListComponent } from '../../../../shared/components';

export interface AvailableEntrySelectEvent {
  event: MouseEvent;
  entry: CatalogEntry;
}

@Component({
  selector: 'app-available-entries',
  standalone: true,
  imports: [CommonModule, EntryItemComponent, SelectionBarComponent, SkeletonListComponent],
  template: `
    <div class="available-section">
      <h3>
        <span class="material-symbols-outlined">inventory_2</span>
        Available Entries
        <span class="count-badge">{{ entries.length }}</span>
      </h3>

      <div class="help-hint">
        <span class="material-symbols-outlined">info</span>
        <span><kbd>Ctrl</kbd>+Click for multi-select, <kbd>Shift</kbd>+Click for range. Drag & drop to assign.</span>
      </div>

      <!-- Selection bar -->
      @if (selectedCount > 0) {
        <app-selection-bar
          [count]="selectedCount"
          [showAssignButton]="showAssignButton"
          (assign)="assignSelected.emit()"
          (clear)="clearSelection.emit()">
        </app-selection-bar>
      }

      <div class="entries-list">
        @if (loading) {
          <app-skeleton-list [count]="6" type="list-item"></app-skeleton-list>
        } @else {
          @for (entry of entries; track entry.id) {
            <app-entry-item
              [entry]="entry"
              [isInOtherNode]="isInOtherNode(entry)"
              [isSelected]="isEntrySelected(entry.id)"
              [showCheckbox]="true"
              [otherNodesNames]="getNodesForEntry(entry)"
              (select)="onEntrySelect($event)"
              (doubleClick)="assignEntry.emit($event)"
              (checkboxChange)="toggleSelection.emit($event.id)"
              (dragStart)="onEntryDragStart($event)">
            </app-entry-item>
          } @empty {
            <p class="empty-hint">No entries match your filters</p>
          }
        }
      </div>
    </div>
  `,
  styles: [`
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

    .entries-list {
      display: flex;
      flex-direction: column;
      min-height: 100px;
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
export class AvailableEntriesComponent {
  @Input() entries: CatalogEntry[] = [];
  @Input() loading = false;
  @Input() selectedEntryIds: Set<string> = new Set();
  @Input() showAssignButton = false;
  @Input() nodeEntryMap: Map<string, string[]> = new Map();
  @Input() nodeNameMap: Map<string, string> = new Map();
  @Input() selectedNodeId: string | null = null;

  @Output() entrySelect = new EventEmitter<AvailableEntrySelectEvent>();
  @Output() entryDragStart = new EventEmitter<{ event: DragEvent; entry: CatalogEntry }>();
  @Output() assignEntry = new EventEmitter<CatalogEntry>();
  @Output() assignSelected = new EventEmitter<void>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() toggleSelection = new EventEmitter<string>();

  get selectedCount(): number {
    return this.selectedEntryIds.size;
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

  onEntrySelect(event: EntryItemSelectEvent): void {
    this.entrySelect.emit({ event: event.event, entry: event.entry });
  }

  onEntryDragStart(event: EntryDragEvent): void {
    this.entryDragStart.emit({ event: event.event, entry: event.entry });
  }
}

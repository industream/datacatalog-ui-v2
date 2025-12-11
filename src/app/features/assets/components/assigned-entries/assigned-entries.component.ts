import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CatalogEntry } from '@industream/datacatalog-client/dto';
import { EntryItemComponent, EntryDragEvent } from '../entry-item/entry-item.component';

@Component({
  selector: 'app-assigned-entries',
  standalone: true,
  imports: [CommonModule, EntryItemComponent],
  template: `
    <div class="assigned-section">
      <h3>
        <span class="material-symbols-outlined">check_circle</span>
        Assigned to "{{ nodeName }}"
        <span class="count-badge">{{ entries.length }}</span>
      </h3>
      <div class="entries-list assigned"
           (dragover)="onDragOver($event)"
           (drop)="drop.emit($event)">
        @if (entries.length === 0) {
          <p class="empty-hint">Drag entries here or double-click to assign</p>
        } @else {
          @for (entry of entries; track entry.id) {
            <app-entry-item
              [entry]="entry"
              [isAssigned]="true"
              (remove)="remove.emit($event)"
              (dragStart)="onEntryDragStart($event)">
            </app-entry-item>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      flex-shrink: 0;
    }

    .assigned-section {
      margin-bottom: var(--dc-space-lg);
      padding-bottom: var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);

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
          color: var(--dc-success);
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
  `]
})
export class AssignedEntriesComponent {
  @Input() nodeName = '';
  @Input() entries: CatalogEntry[] = [];

  @Output() drop = new EventEmitter<DragEvent>();
  @Output() remove = new EventEmitter<CatalogEntry>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; entry: CatalogEntry }>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onEntryDragStart(event: EntryDragEvent): void {
    this.dragStart.emit({ event: event.event, entry: event.entry });
  }
}

import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogEntry, Label } from '../../../../core/models';
import { LabelColorService } from '../../../../core/services';

export interface EntryDragEvent {
  event: DragEvent;
  entry: CatalogEntry;
}

export interface EntrySelectEvent {
  event: MouseEvent;
  entry: CatalogEntry;
}

@Component({
  selector: 'app-entry-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="entry-item"
      [class.assigned]="isAssigned"
      [class.in-other-node]="isInOtherNode"
      [class.selected]="isSelected"
      draggable="true"
      (dragstart)="onDragStart($event)"
      (dblclick)="onDoubleClick()"
      (click)="onClick($event)">

      @if (showCheckbox) {
        <input
          type="checkbox"
          class="entry-checkbox"
          [checked]="isSelected"
          (click)="$event.stopPropagation()"
          (change)="onCheckboxChange()">
      }

      <div class="entry-main">
        <span class="entry-name">{{ entry.name }}</span>
        <div class="entry-meta">
          <span class="entry-source" [title]="entry.sourceConnection.name">
            <span class="material-symbols-outlined">database</span>
            {{ entry.sourceConnection.name }}
          </span>
          <span class="entry-type">{{ entry.dataType }}</span>
        </div>
      </div>

      @if (entry.labels && entry.labels.length > 0) {
        <div class="entry-labels">
          @for (label of displayedLabels; track label.id) {
            <span class="entry-label" [style.background]="getLabelColor(label)">
              {{ label.name }}
            </span>
          }
          @if (hiddenLabelsCount > 0) {
            <span class="more-labels">+{{ hiddenLabelsCount }}</span>
          }
        </div>
      }

      @if (isInOtherNode && otherNodesNames) {
        <div class="in-nodes-info" [title]="'Also in: ' + otherNodesNames">
          <span class="material-symbols-outlined">account_tree</span>
          <span class="nodes-list">{{ truncatedNodesNames }}</span>
        </div>
      }

      @if (isAssigned) {
        <button class="icon-btn small danger" title="Remove" (click)="onRemove($event)">
          <span class="material-symbols-outlined">close</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .entry-item {
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-sm);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      margin-bottom: 4px;
      cursor: grab;
      transition: all var(--dc-duration-fast);
      position: relative;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        background: var(--dc-bg-primary);

        .entry-checkbox {
          opacity: 1;
        }
      }

      &.assigned {
        background: var(--dc-bg-tertiary);
        border-left: 3px solid var(--dc-primary);
      }

      &.in-other-node {
        opacity: 0.7;
      }

      &.selected {
        background: color-mix(in srgb, var(--dc-primary) 15%, var(--dc-bg-tertiary));
        outline: 2px solid var(--dc-primary);
        outline-offset: -2px;

        .entry-checkbox {
          opacity: 1;
        }
      }
    }

    .entry-checkbox {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 2px;
      opacity: 0;
      cursor: pointer;
      accent-color: var(--dc-primary);
      transition: opacity var(--dc-duration-fast);
    }

    .entry-main {
      flex: 1;
      min-width: 0;
    }

    .entry-name {
      font-size: var(--dc-text-size-sm);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .entry-meta {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      margin-top: 2px;
    }

    .entry-source {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 11px;
      color: var(--dc-text-secondary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .material-symbols-outlined {
        font-size: 12px;
        flex-shrink: 0;
      }
    }

    .entry-type {
      font-size: 11px;
      color: var(--dc-text-secondary);
      background: var(--dc-bg-secondary);
      padding: 1px 6px;
      border-radius: var(--dc-radius-sm);
      font-family: monospace;
      flex-shrink: 0;
    }

    .entry-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      width: 100%;
      margin-top: 2px;
    }

    .entry-label {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: var(--dc-radius-full);
      color: white;
      font-weight: 500;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .more-labels {
      font-size: 10px;
      padding: 1px 6px;
      background: var(--dc-bg-secondary);
      border-radius: var(--dc-radius-full);
      color: var(--dc-text-secondary);
    }

    .in-nodes-info {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--dc-warning) 15%, transparent);
      border-radius: var(--dc-radius-full);
      font-size: 10px;
      color: var(--dc-warning);
      flex-shrink: 0;
      max-width: 150px;
      cursor: help;

      .material-symbols-outlined {
        font-size: 12px;
        flex-shrink: 0;
      }

      .nodes-list {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
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

      &.small {
        width: 22px;
        height: 22px;

        .material-symbols-outlined {
          font-size: 16px;
        }
      }
    }
  `]
})
export class EntryItemComponent {
  private readonly labelColorService = inject(LabelColorService);

  @Input({ required: true }) entry!: CatalogEntry;
  @Input() isAssigned = false;
  @Input() isInOtherNode = false;
  @Input() isSelected = false;
  @Input() showCheckbox = false;
  @Input() otherNodesNames = '';
  @Input() maxLabels = 3;

  @Output() select = new EventEmitter<{ event: MouseEvent; entry: CatalogEntry }>();
  @Output() doubleClick = new EventEmitter<CatalogEntry>();
  @Output() remove = new EventEmitter<CatalogEntry>();
  @Output() checkboxChange = new EventEmitter<CatalogEntry>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; entry: CatalogEntry }>();

  get displayedLabels(): Label[] {
    return this.entry.labels?.slice(0, this.maxLabels) || [];
  }

  get hiddenLabelsCount(): number {
    const total = this.entry.labels?.length || 0;
    return Math.max(0, total - this.maxLabels);
  }

  get truncatedNodesNames(): string {
    if (!this.otherNodesNames) return '';
    const names = this.otherNodesNames.split(', ');
    if (names.length <= 2) return this.otherNodesNames;
    return `${names[0]}, +${names.length - 1}`;
  }

  getLabelColor(label: Label): string {
    return this.labelColorService.getColor(label);
  }

  onClick(event: MouseEvent): void {
    this.select.emit({ event, entry: this.entry });
  }

  onDoubleClick(): void {
    this.doubleClick.emit(this.entry);
  }

  onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(this.entry);
  }

  onCheckboxChange(): void {
    this.checkboxChange.emit(this.entry);
  }

  onDragStart(event: DragEvent): void {
    this.dragStart.emit({ event, entry: this.entry });
  }
}

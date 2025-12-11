import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { AssetNode } from '../../../../store/asset-dictionary.store';

export interface TreeNodeAction {
  type: 'select' | 'toggle-expand' | 'add-child' | 'edit' | 'delete';
  node: AssetNode;
}

export interface TreeNodeDragEvent {
  type: 'start' | 'end' | 'over' | 'leave' | 'drop';
  event: DragEvent;
  node: AssetNode;
}

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      class="tree-node"
      [class.selected]="isSelected"
      [class.expanded]="node.expanded !== false"
      [class.drag-over]="isDragOver"
      [style.--level]="level"
      draggable="true"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="onSelect()">

      <div class="node-content">
        @if (hasChildren) {
          <button class="expand-btn" (click)="onToggleExpand($event)">
            <span class="material-symbols-outlined">
              {{ node.expanded !== false ? 'expand_more' : 'chevron_right' }}
            </span>
          </button>
        } @else {
          <span class="expand-spacer"></span>
        }

        <span class="node-icon material-symbols-outlined">{{ node.icon || 'folder' }}</span>
        <span class="node-name">{{ node.name }}</span>

        @if (entryCount > 0) {
          <span class="tag-count" [title]="entryCount + ' tags assigned'">
            {{ entryCount }}
          </span>
        }
      </div>

      <div class="node-actions">
        <button class="icon-btn small" title="Add child" (click)="onAddChild($event)">
          <span class="material-symbols-outlined">add</span>
        </button>
        <button class="icon-btn small" title="Edit" (click)="onEdit($event)">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="icon-btn small danger" title="Delete" (click)="onDelete($event)">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>

    @if (hasChildren && node.expanded !== false) {
      <div class="node-children">
        @for (child of node.children; track child.id) {
          <app-tree-node
            [node]="child"
            [level]="level + 1"
            [selectedNodeId]="selectedNodeId"
            [dragOverNodeId]="dragOverNodeId"
            (action)="action.emit($event)"
            (dragEvent)="dragEvent.emit($event)">
          </app-tree-node>
        }
      </div>
    }
  `,
  styles: [`
    .tree-node {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--dc-space-xs) var(--dc-space-sm);
      padding-left: calc(var(--dc-space-sm) + (var(--level, 0) * 20px));
      border-radius: var(--dc-radius-sm);
      cursor: pointer;
      transition: all var(--dc-duration-fast);
      margin-bottom: 2px;

      &:hover {
        background: var(--dc-bg-tertiary);

        .node-actions {
          opacity: 1;
        }
      }

      &.selected {
        background: color-mix(in srgb, var(--dc-primary) 15%, transparent);

        .node-name {
          color: var(--dc-primary);
          font-weight: 500;
        }
      }

      &.drag-over {
        background: color-mix(in srgb, var(--dc-primary) 20%, transparent);
        outline: 2px dashed var(--dc-primary);
      }
    }

    .node-content {
      display: flex;
      align-items: center;
      gap: var(--dc-space-xs);
      flex: 1;
      min-width: 0;
    }

    .expand-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: 2px;
      padding: 0;

      &:hover {
        background: var(--dc-bg-secondary);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .expand-spacer {
      width: 20px;
    }

    .node-icon {
      font-size: 18px;
      color: var(--dc-text-secondary);
    }

    .node-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--dc-text-size-sm);
    }

    .tag-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: var(--dc-primary);
      color: white;
      border-radius: var(--dc-radius-full);
      font-size: 10px;
      font-weight: 600;
    }

    .node-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity var(--dc-duration-fast);
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
export class TreeNodeComponent {
  @Input({ required: true }) node!: AssetNode;
  @Input() level = 0;
  @Input() selectedNodeId: string | null = null;
  @Input() dragOverNodeId: string | null = null;

  @Output() action = new EventEmitter<TreeNodeAction>();
  @Output() dragEvent = new EventEmitter<TreeNodeDragEvent>();

  get isSelected(): boolean {
    return this.selectedNodeId === this.node.id;
  }

  get isDragOver(): boolean {
    return this.dragOverNodeId === this.node.id;
  }

  get hasChildren(): boolean {
    return Boolean(this.node.children && this.node.children.length > 0);
  }

  get entryCount(): number {
    return this.node.entryIds?.length || 0;
  }

  onSelect(): void {
    this.action.emit({ type: 'select', node: this.node });
  }

  onToggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    this.action.emit({ type: 'toggle-expand', node: this.node });
  }

  onAddChild(event: MouseEvent): void {
    event.stopPropagation();
    this.action.emit({ type: 'add-child', node: this.node });
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.action.emit({ type: 'edit', node: this.node });
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.action.emit({ type: 'delete', node: this.node });
  }

  onDragStart(event: DragEvent): void {
    this.dragEvent.emit({ type: 'start', event, node: this.node });
  }

  onDragEnd(event: DragEvent): void {
    this.dragEvent.emit({ type: 'end', event, node: this.node });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragEvent.emit({ type: 'over', event, node: this.node });
  }

  onDragLeave(event: DragEvent): void {
    this.dragEvent.emit({ type: 'leave', event, node: this.node });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragEvent.emit({ type: 'drop', event, node: this.node });
  }
}

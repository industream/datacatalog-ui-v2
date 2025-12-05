import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetNode } from '../../../../core/models';
import { TreeNodeComponent, TreeNodeAction, TreeNodeDragEvent } from '../tree-node/tree-node.component';
import { SkeletonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-tree-panel',
  standalone: true,
  imports: [CommonModule, TreeNodeComponent, SkeletonComponent],
  template: `
    <div class="tree-panel">
      <div class="panel-header">
        <h2>Asset Hierarchy</h2>
        <span class="node-count">{{ nodeCount }} nodes</span>
      </div>

      <div class="tree-container"
           (dragover)="onDragOver($event)"
           (drop)="dropOnRoot.emit($event)">
        @if (loading) {
          <div class="skeleton-tree">
            @for (item of [1,2,3,4,5]; track item) {
              <div class="skeleton-node" [style.padding-left.px]="item % 2 === 0 ? 24 : 0">
                <app-skeleton type="avatar" width="24px" height="24px"></app-skeleton>
                <app-skeleton type="text" [width]="item % 3 === 0 ? '60%' : '80%'"></app-skeleton>
              </div>
            }
          </div>
        } @else if (nodes.length === 0) {
          <div class="empty-tree">
            <span class="material-symbols-outlined">account_tree</span>
            <p>No nodes yet</p>
            <button class="add-btn" (click)="addRootNode.emit()">
              <span class="material-symbols-outlined">add</span>
              Add first node
            </button>
          </div>
        } @else {
          <div class="tree-content">
            @for (node of nodes; track node.id) {
              <app-tree-node
                [node]="node"
                [level]="0"
                [selectedNodeId]="selectedNodeId"
                [dragOverNodeId]="dragOverNodeId"
                (action)="nodeAction.emit($event)"
                (dragEvent)="nodeDrag.emit($event)">
              </app-tree-node>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tree-panel {
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
      padding: var(--dc-space-md);
      border-bottom: 1px solid var(--dc-border-subtle);

      h2 {
        margin: 0;
        font-size: var(--dc-text-size-md);
        font-weight: 600;
        color: var(--dc-text-primary);
      }

      .node-count {
        font-size: var(--dc-text-size-sm);
        color: var(--dc-text-secondary);
        background: var(--dc-bg-tertiary);
        padding: 2px 8px;
        border-radius: var(--dc-radius-full);
      }
    }

    .tree-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--dc-space-md);
      min-height: 200px;
    }

    .empty-tree {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-xl) var(--dc-space-lg);
      color: var(--dc-text-secondary);
      text-align: center;

      .material-symbols-outlined {
        font-size: 48px;
        margin-bottom: var(--dc-space-md);
        opacity: 0.5;
      }

      p {
        margin: 0 0 var(--dc-space-md);
      }
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--dc-space-xs);
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-primary);
      color: white;
      border: none;
      border-radius: var(--dc-radius-md);
      cursor: pointer;
      font-size: var(--dc-text-size-sm);
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-primary-hover);
      }

      .material-symbols-outlined {
        font-size: 18px;
        margin-bottom: 0;
        opacity: 1;
      }
    }

    .tree-content {
      display: flex;
      flex-direction: column;
    }

    .skeleton-tree {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-sm);
    }

    .skeleton-node {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-sm);
    }
  `]
})
export class TreePanelComponent {
  @Input() nodes: AssetNode[] = [];
  @Input() nodeCount = 0;
  @Input() loading = false;
  @Input() selectedNodeId: string | null = null;
  @Input() dragOverNodeId: string | null = null;

  @Output() nodeAction = new EventEmitter<TreeNodeAction>();
  @Output() nodeDrag = new EventEmitter<TreeNodeDragEvent>();
  @Output() addRootNode = new EventEmitter<void>();
  @Output() dropOnRoot = new EventEmitter<DragEvent>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
}

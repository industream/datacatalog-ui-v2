import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import '@carbon/web-components/es/components/button/index.js';

import { AssetNode, CatalogEntry } from '../../core/models';
import { AssetDictionaryStore } from './asset-dictionary.store';
import { CatalogStore } from '../../store';

@Component({
  selector: 'app-asset-editor',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="editor-container">
      <!-- Header -->
      <header class="editor-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          @if (dictionary()) {
            <div class="header-info">
              <div class="dict-icon" [style.background]="dictionary()?.color || 'var(--dc-primary)'">
                <span class="material-symbols-outlined">{{ dictionary()?.icon || 'account_tree' }}</span>
              </div>
              <div class="header-text">
                <h1>{{ dictionary()?.name }}</h1>
                <p class="subtitle">{{ dictionary()?.description || 'Asset hierarchy editor' }}</p>
              </div>
            </div>
          }
        </div>
        <div class="header-actions">
          <cds-button kind="tertiary" (click)="addRootNode()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            Add Root Node
          </cds-button>
        </div>
      </header>

      <div class="editor-content">
        <!-- Left Panel: Asset Tree -->
        <div class="tree-panel">
          <div class="panel-header">
            <h2>Asset Hierarchy</h2>
            <span class="node-count">{{ flatNodes().length }} nodes</span>
          </div>

          <div class="tree-container"
               (dragover)="onDragOver($event)"
               (drop)="onDropOnRoot($event)">
            @if (treeNodes().length === 0) {
              <div class="empty-tree">
                <span class="material-symbols-outlined">account_tree</span>
                <p>No nodes yet</p>
                <button class="add-btn" (click)="addRootNode()">
                  <span class="material-symbols-outlined">add</span>
                  Add first node
                </button>
              </div>
            } @else {
              <div class="tree-content">
                @for (node of treeNodes(); track node.id) {
                  <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node, level: 0 }"></ng-container>
                }
              </div>
            }
          </div>

          <ng-template #nodeTemplate let-node let-level="level">
            <div class="tree-node"
                 [class.selected]="selectedNodeId() === node.id"
                 [class.expanded]="node.expanded !== false"
                 [class.drag-over]="dragOverNodeId() === node.id"
                 [style.--level]="level"
                 draggable="true"
                 (dragstart)="onDragStart($event, node)"
                 (dragend)="onDragEnd($event)"
                 (dragover)="onDragOverNode($event, node)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDropOnNode($event, node)"
                 (click)="selectNode(node)">
              <div class="node-content">
                @if (node.children && node.children.length > 0) {
                  <button class="expand-btn" (click)="toggleExpand(node); $event.stopPropagation()">
                    <span class="material-symbols-outlined">
                      {{ node.expanded !== false ? 'expand_more' : 'chevron_right' }}
                    </span>
                  </button>
                } @else {
                  <span class="expand-spacer"></span>
                }
                <span class="node-icon material-symbols-outlined">{{ node.icon || 'folder' }}</span>
                <span class="node-name">{{ node.name }}</span>
                @if (node.entryIds.length > 0) {
                  <span class="tag-count" [title]="node.entryIds.length + ' tags assigned'">
                    {{ node.entryIds.length }}
                  </span>
                }
              </div>
              <div class="node-actions">
                <button class="icon-btn small" title="Add child" (click)="addChildNode(node); $event.stopPropagation()">
                  <span class="material-symbols-outlined">add</span>
                </button>
                <button class="icon-btn small" title="Edit" (click)="editNode(node); $event.stopPropagation()">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="icon-btn small danger" title="Delete" (click)="deleteNode(node); $event.stopPropagation()">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
            @if (node.children && node.children.length > 0 && node.expanded !== false) {
              <div class="node-children">
                @for (child of node.children; track child.id) {
                  <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child, level: level + 1 }"></ng-container>
                }
              </div>
            }
          </ng-template>
        </div>

        <!-- Right Panel: Tag Assignment -->
        <div class="tags-panel">
          <div class="panel-header">
            <h2>Catalog Entries</h2>
            <input
              type="text"
              class="search-input"
              placeholder="Search entries..."
              [value]="searchQuery()"
              (input)="onSearchInput($event)">
          </div>

          <div class="tags-container">
            @if (selectedNodeId()) {
              <div class="assigned-section">
                <h3>
                  <span class="material-symbols-outlined">check_circle</span>
                  Assigned to "{{ getSelectedNode()?.name }}"
                </h3>
                <div class="entries-list assigned"
                     (dragover)="onDragOver($event)"
                     (drop)="onDropEntry($event)">
                  @if (assignedEntries().length === 0) {
                    <p class="empty-hint">Drag entries here to assign them</p>
                  } @else {
                    @for (entry of assignedEntries(); track entry.id) {
                      <div class="entry-item assigned"
                           draggable="true"
                           (dragstart)="onEntryDragStart($event, entry, true)">
                        <span class="entry-name">{{ entry.name }}</span>
                        <span class="entry-type">{{ entry.dataType }}</span>
                        <button class="icon-btn small danger" title="Remove" (click)="unassignEntry(entry)">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <div class="available-section">
              <h3>
                <span class="material-symbols-outlined">inventory_2</span>
                Available Entries
              </h3>
              <div class="entries-list">
                @for (entry of filteredAvailableEntries(); track entry.id) {
                  <div class="entry-item"
                       [class.in-other-node]="isInOtherNode(entry)"
                       draggable="true"
                       (dragstart)="onEntryDragStart($event, entry, false)"
                       (dblclick)="assignEntry(entry)">
                    <span class="entry-name">{{ entry.name }}</span>
                    <span class="entry-type">{{ entry.dataType }}</span>
                    @if (isInOtherNode(entry)) {
                      <span class="in-node-badge" [title]="'Already in: ' + getNodesForEntry(entry)">
                        <span class="material-symbols-outlined">link</span>
                      </span>
                    }
                  </div>
                } @empty {
                  <p class="empty-hint">No entries match your search</p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Node Edit Modal -->
      @if (showNodeModal()) {
        <div class="modal-backdrop" (click)="closeNodeModal()">
          <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingNode() ? 'Edit Node' : 'New Node' }}</h2>
              <button class="icon-btn" (click)="closeNodeModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="node-name">Name *</label>
                <input
                  type="text"
                  id="node-name"
                  class="form-input"
                  [value]="nodeName()"
                  (input)="onNodeNameInput($event)"
                  placeholder="e.g., Production Line 1">
              </div>

              <div class="form-group">
                <label for="node-description">Description</label>
                <textarea
                  id="node-description"
                  class="form-textarea"
                  [value]="nodeDescription()"
                  (input)="onNodeDescriptionInput($event)"
                  placeholder="Optional description..."></textarea>
              </div>

              <div class="form-group">
                <label>Icon</label>
                <div class="icon-selector">
                  @for (icon of nodeIcons; track icon) {
                    <button
                      class="icon-option"
                      [class.selected]="nodeIcon() === icon"
                      (click)="nodeIcon.set(icon)">
                      <span class="material-symbols-outlined">{{ icon }}</span>
                    </button>
                  }
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeNodeModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="saveNode()" [disabled]="!nodeName()">
                {{ editingNode() ? 'Update' : 'Create' }}
              </cds-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .editor-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 48px);
      overflow: hidden;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-md) var(--dc-space-lg);
      background: var(--dc-bg-secondary);
      border-bottom: 1px solid var(--dc-border-subtle);
      flex-shrink: 0;

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--dc-space-md);
      }

      .back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: var(--dc-bg-tertiary);
        color: var(--dc-text-primary);
        border-radius: var(--dc-radius-sm);
        cursor: pointer;
        transition: all var(--dc-duration-fast);

        &:hover {
          background: var(--dc-primary);
          color: white;
        }
      }

      .header-info {
        display: flex;
        align-items: center;
        gap: var(--dc-space-md);
      }

      .dict-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--dc-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;

        .material-symbols-outlined {
          font-size: 24px;
        }
      }

      .header-text {
        h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .subtitle {
          margin: 0;
          font-size: var(--dc-text-size-sm);
          color: var(--dc-text-secondary);
        }
      }
    }

    .editor-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .tree-panel {
      width: 400px;
      min-width: 300px;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--dc-border-subtle);
      background: var(--dc-bg-secondary);
    }

    .tags-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--dc-bg-primary);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-md) var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .node-count {
        font-size: var(--dc-text-size-sm);
        color: var(--dc-text-secondary);
        background: var(--dc-bg-tertiary);
        padding: 2px 8px;
        border-radius: var(--dc-radius-full);
      }

      .search-input {
        width: 200px;
        padding: 6px 12px;
        background: var(--dc-bg-tertiary);
        border: 1px solid var(--dc-border-subtle);
        border-radius: var(--dc-radius-sm);
        color: var(--dc-text-primary);
        font-size: var(--dc-text-size-sm);

        &:focus {
          outline: none;
          border-color: var(--dc-primary);
        }

        &::placeholder {
          color: var(--dc-text-placeholder);
        }
      }
    }

    .tree-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--dc-space-sm);
    }

    .empty-tree {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-xl);
      text-align: center;
      color: var(--dc-text-secondary);

      .material-symbols-outlined {
        font-size: 48px;
        margin-bottom: var(--dc-space-md);
        opacity: 0.5;
      }

      p {
        margin: 0 0 var(--dc-space-md);
      }

      .add-btn {
        display: flex;
        align-items: center;
        gap: var(--dc-space-xs);
        padding: var(--dc-space-sm) var(--dc-space-md);
        background: var(--dc-primary);
        color: white;
        border: none;
        border-radius: var(--dc-radius-sm);
        cursor: pointer;
        font-size: var(--dc-text-size-sm);

        &:hover {
          background: var(--dc-primary-hover);
        }

        .material-symbols-outlined {
          font-size: 18px;
          margin-bottom: 0;
          opacity: 1;
        }
      }
    }

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
    }

    .node-children {
      /* Children are indented via --level in .tree-node */
    }

    .tags-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--dc-space-md);
    }

    .assigned-section,
    .available-section {
      margin-bottom: var(--dc-space-lg);

      h3 {
        display: flex;
        align-items: center;
        gap: var(--dc-space-xs);
        margin: 0 0 var(--dc-space-sm);
        font-size: var(--dc-text-size-sm);
        font-weight: 600;
        color: var(--dc-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;

        .material-symbols-outlined {
          font-size: 16px;
        }
      }
    }

    .entries-list {
      min-height: 60px;
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      padding: var(--dc-space-xs);

      &.assigned {
        border-style: dashed;
        border-color: var(--dc-primary);
        background: color-mix(in srgb, var(--dc-primary) 5%, var(--dc-bg-secondary));
      }

      .empty-hint {
        margin: 0;
        padding: var(--dc-space-md);
        text-align: center;
        color: var(--dc-text-placeholder);
        font-size: var(--dc-text-size-sm);
      }
    }

    .entry-item {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-xs) var(--dc-space-sm);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      margin-bottom: 4px;
      cursor: grab;
      transition: all var(--dc-duration-fast);

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        background: var(--dc-bg-primary);
      }

      &.assigned {
        background: var(--dc-bg-tertiary);
        border-left: 3px solid var(--dc-primary);
      }

      &.in-other-node {
        opacity: 0.7;
      }

      .entry-name {
        flex: 1;
        font-size: var(--dc-text-size-sm);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entry-type {
        font-size: 11px;
        color: var(--dc-text-secondary);
        background: var(--dc-bg-secondary);
        padding: 1px 6px;
        border-radius: var(--dc-radius-sm);
        font-family: monospace;
      }

      .in-node-badge {
        color: var(--dc-text-placeholder);

        .material-symbols-outlined {
          font-size: 14px;
        }
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

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--dc-space-xl);
    }

    .modal-content {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--dc-shadow-xl);
    }

    .modal-sm {
      max-width: 400px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
    }

    .modal-body {
      padding: var(--dc-space-lg);
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-lg);
      border-top: 1px solid var(--dc-border-subtle);
    }

    .form-group {
      margin-bottom: var(--dc-space-lg);

      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-weight: 500;
        font-size: 0.875rem;
      }
    }

    .form-input,
    .form-textarea {
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

      &::placeholder {
        color: var(--dc-text-placeholder);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 60px;
    }

    .icon-selector {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dc-space-xs);
    }

    .icon-option {
      width: 36px;
      height: 36px;
      border: 1px solid var(--dc-border-subtle);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--dc-text-secondary);
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-primary);
        color: var(--dc-text-primary);
      }

      &.selected {
        border-color: var(--dc-primary);
        background: var(--dc-primary);
        color: white;
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }
  `]
})
export class AssetEditorComponent implements OnInit {
  readonly store = inject(AssetDictionaryStore);
  readonly catalogStore = inject(CatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly searchQuery = signal('');
  readonly selectedNodeId = signal<string | null>(null);
  readonly dragOverNodeId = signal<string | null>(null);
  readonly showNodeModal = signal(false);
  readonly editingNode = signal<AssetNode | null>(null);
  readonly parentNodeIdForNew = signal<string | null>(null);

  // Node form
  readonly nodeName = signal('');
  readonly nodeDescription = signal('');
  readonly nodeIcon = signal('folder');

  readonly nodeIcons = [
    'folder', 'factory', 'precision_manufacturing', 'settings',
    'bolt', 'memory', 'developer_board', 'dns', 'storage',
    'air', 'electrical_services', 'water_drop', 'thermostat',
    'sensors', 'speed', 'monitor_heart', 'analytics'
  ];

  // Expand state stored locally (not persisted)
  private expandState = new Map<string, boolean>();

  readonly dictionary = this.store.selectedDictionary;

  readonly flatNodes = computed(() => {
    const dict = this.dictionary();
    return dict ? dict.nodes : [];
  });

  readonly treeNodes = computed(() => {
    const nodes = this.store.selectedDictionaryTree();
    // Apply expand state
    return this.applyExpandState(nodes);
  });

  readonly assignedEntries = computed(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) return [];

    const node = this.flatNodes().find(n => n.id === nodeId);
    if (!node) return [];

    const entries = this.catalogStore.entries();
    return entries.filter(e => node.entryIds.includes(e.id));
  });

  readonly filteredAvailableEntries = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const nodeId = this.selectedNodeId();
    const node = nodeId ? this.flatNodes().find(n => n.id === nodeId) : null;
    const assignedIds = new Set(node?.entryIds || []);

    let entries = this.catalogStore.entries();

    // Filter out assigned ones
    entries = entries.filter(e => !assignedIds.has(e.id));

    // Apply search
    if (query) {
      entries = entries.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.dataType.toLowerCase().includes(query)
      );
    }

    return entries;
  });

  private draggedEntry: CatalogEntry | null = null;
  private draggedFromAssigned = false;
  private draggedNode: AssetNode | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.selectDictionary(id);
      // Ensure entries are loaded
      if (this.catalogStore.entries().length === 0) {
        this.catalogStore.loadAll();
      }
    } else {
      this.router.navigate(['/assets']);
    }
  }

  goBack(): void {
    this.router.navigate(['/assets']);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onNodeNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.nodeName.set(input.value);
  }

  onNodeDescriptionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.nodeDescription.set(textarea.value);
  }

  getSelectedNode(): AssetNode | undefined {
    const id = this.selectedNodeId();
    return id ? this.flatNodes().find(n => n.id === id) : undefined;
  }

  selectNode(node: AssetNode): void {
    this.selectedNodeId.set(node.id);
  }

  toggleExpand(node: AssetNode): void {
    const current = this.expandState.get(node.id) ?? true;
    this.expandState.set(node.id, !current);
    // Force recompute
    this.store.selectDictionary(this.dictionary()?.id || null);
  }

  private applyExpandState(nodes: AssetNode[]): AssetNode[] {
    return nodes.map(n => ({
      ...n,
      expanded: this.expandState.get(n.id) ?? true,
      children: n.children ? this.applyExpandState(n.children) : undefined
    }));
  }

  addRootNode(): void {
    this.parentNodeIdForNew.set(null);
    this.nodeName.set('');
    this.nodeDescription.set('');
    this.nodeIcon.set('folder');
    this.editingNode.set(null);
    this.showNodeModal.set(true);
  }

  addChildNode(parent: AssetNode): void {
    this.parentNodeIdForNew.set(parent.id);
    this.nodeName.set('');
    this.nodeDescription.set('');
    this.nodeIcon.set('folder');
    this.editingNode.set(null);
    this.showNodeModal.set(true);
  }

  editNode(node: AssetNode): void {
    this.editingNode.set(node);
    this.nodeName.set(node.name);
    this.nodeDescription.set(node.description || '');
    this.nodeIcon.set(node.icon || 'folder');
    this.showNodeModal.set(true);
  }

  deleteNode(node: AssetNode): void {
    const dict = this.dictionary();
    if (!dict) return;

    if (confirm(`Delete "${node.name}" and all its children?`)) {
      this.store.deleteNode(dict.id, node.id);
      if (this.selectedNodeId() === node.id) {
        this.selectedNodeId.set(null);
      }
    }
  }

  closeNodeModal(): void {
    this.showNodeModal.set(false);
    this.editingNode.set(null);
    this.parentNodeIdForNew.set(null);
  }

  saveNode(): void {
    const dict = this.dictionary();
    if (!dict || !this.nodeName()) return;

    const editing = this.editingNode();

    if (editing) {
      this.store.updateNode({
        id: editing.id,
        dictionaryId: dict.id,
        name: this.nodeName(),
        description: this.nodeDescription() || undefined,
        icon: this.nodeIcon()
      });
    } else {
      this.store.addNode({
        dictionaryId: dict.id,
        name: this.nodeName(),
        description: this.nodeDescription() || undefined,
        icon: this.nodeIcon(),
        parentId: this.parentNodeIdForNew()
      });
    }

    this.closeNodeModal();
  }

  // Drag & Drop for nodes
  onDragStart(event: DragEvent, node: AssetNode): void {
    this.draggedNode = node;
    event.dataTransfer?.setData('text/plain', node.id);
  }

  onDragEnd(event: DragEvent): void {
    this.draggedNode = null;
    this.dragOverNodeId.set(null);
  }

  onDragOverNode(event: DragEvent, node: AssetNode): void {
    event.preventDefault();
    if (this.draggedNode && this.draggedNode.id !== node.id) {
      this.dragOverNodeId.set(node.id);
    }
  }

  onDragLeave(event: DragEvent): void {
    this.dragOverNodeId.set(null);
  }

  onDropOnNode(event: DragEvent, targetNode: AssetNode): void {
    event.preventDefault();
    this.dragOverNodeId.set(null);

    const dict = this.dictionary();
    if (!dict) return;

    if (this.draggedNode) {
      // Moving a node
      this.store.moveNode(dict.id, this.draggedNode.id, targetNode.id, 0);
      this.draggedNode = null;
    } else if (this.draggedEntry) {
      // Dropping an entry on a node - assign it
      this.store.addEntryToNode(dict.id, targetNode.id, this.draggedEntry.id);
      this.draggedEntry = null;
    }
  }

  onDropOnRoot(event: DragEvent): void {
    event.preventDefault();

    const dict = this.dictionary();
    if (!dict || !this.draggedNode) return;

    // Move to root
    this.store.moveNode(dict.id, this.draggedNode.id, null, 0);
    this.draggedNode = null;
  }

  // Drag & Drop for entries
  onEntryDragStart(event: DragEvent, entry: CatalogEntry, fromAssigned: boolean): void {
    this.draggedEntry = entry;
    this.draggedFromAssigned = fromAssigned;
    event.dataTransfer?.setData('text/plain', entry.id);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropEntry(event: DragEvent): void {
    event.preventDefault();

    const dict = this.dictionary();
    const nodeId = this.selectedNodeId();
    if (!dict || !nodeId || !this.draggedEntry) return;

    if (!this.draggedFromAssigned) {
      this.store.addEntryToNode(dict.id, nodeId, this.draggedEntry.id);
    }

    this.draggedEntry = null;
  }

  assignEntry(entry: CatalogEntry): void {
    const dict = this.dictionary();
    const nodeId = this.selectedNodeId();
    if (!dict || !nodeId) return;

    this.store.addEntryToNode(dict.id, nodeId, entry.id);
  }

  unassignEntry(entry: CatalogEntry): void {
    const dict = this.dictionary();
    const nodeId = this.selectedNodeId();
    if (!dict || !nodeId) return;

    this.store.removeEntryFromNode(dict.id, nodeId, entry.id);
  }

  isInOtherNode(entry: CatalogEntry): boolean {
    const nodeId = this.selectedNodeId();
    return this.flatNodes().some(n => n.id !== nodeId && n.entryIds.includes(entry.id));
  }

  getNodesForEntry(entry: CatalogEntry): string {
    return this.flatNodes()
      .filter(n => n.entryIds.includes(entry.id))
      .map(n => n.name)
      .join(', ');
  }
}

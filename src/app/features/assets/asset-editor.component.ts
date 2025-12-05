import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import '@carbon/web-components/es/components/button/index.js';

import { AssetNode, CatalogEntry, Label } from '../../core/models';
import { ConfirmationService } from '../../core/services';
import { AssetDictionaryStore } from './asset-dictionary.store';
import { CatalogStore } from '../../store';
import {
  TreeNodeComponent,
  TreeNodeAction,
  TreeNodeDragEvent,
  EntryItemComponent,
  NodeFormModalComponent,
  NodeSaveEvent,
  SelectionBarComponent,
  LabelFilterComponent
} from './components';

@Component({
  selector: 'app-asset-editor',
  standalone: true,
  imports: [
    CommonModule,
    TreeNodeComponent,
    EntryItemComponent,
    NodeFormModalComponent,
    SelectionBarComponent,
    LabelFilterComponent
  ],
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
                  <app-tree-node
                    [node]="node"
                    [level]="0"
                    [selectedNodeId]="selectedNodeId()"
                    [dragOverNodeId]="dragOverNodeId()"
                    (action)="onTreeNodeAction($event)"
                    (dragEvent)="onTreeNodeDrag($event)">
                  </app-tree-node>
                }
              </div>
            }
          </div>
        </div>

        <!-- Right Panel: Tag Assignment -->
        <div class="tags-panel">
          <div class="panel-header">
            <h2>Catalog Entries</h2>
            <div class="filter-controls">
              <input
                type="text"
                class="search-input"
                placeholder="Search entries..."
                [value]="searchQuery()"
                (input)="onSearchInput($event)">
            </div>
          </div>

          <!-- Label Filter -->
          <app-label-filter
            [labels]="availableLabels()"
            [selectedLabelId]="selectedLabelFilter()"
            (labelSelect)="setLabelFilter($event)">
          </app-label-filter>

          <div class="tags-container">
            @if (selectedNodeId()) {
              <div class="assigned-section">
                <h3>
                  <span class="material-symbols-outlined">check_circle</span>
                  Assigned to "{{ getSelectedNode()?.name }}"
                  <span class="count-badge">{{ assignedEntries().length }}</span>
                </h3>
                <div class="entries-list assigned"
                     (dragover)="onDragOver($event)"
                     (drop)="onDropEntry($event)">
                  @if (assignedEntries().length === 0) {
                    <p class="empty-hint">Drag entries here or double-click to assign</p>
                  } @else {
                    @for (entry of assignedEntries(); track entry.id) {
                      <app-entry-item
                        [entry]="entry"
                        [isAssigned]="true"
                        (remove)="unassignEntry($event)"
                        (dragStart)="onEntryDragStart($event.event, $event.entry, true)">
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
                <span class="count-badge">{{ filteredAvailableEntries().length }}</span>
              </h3>

              <div class="help-hint">
                <span class="material-symbols-outlined">info</span>
                <span><kbd>Ctrl</kbd>+Click for multi-select, <kbd>Shift</kbd>+Click for range. Drag & drop to assign.</span>
              </div>

              <!-- Selection bar -->
              @if (selectedEntryIds().size > 0) {
                <app-selection-bar
                  [count]="selectedEntryIds().size"
                  [showAssignButton]="!!selectedNodeId()"
                  (assign)="assignSelectedEntries()"
                  (clear)="clearSelection()">
                </app-selection-bar>
              }

              <div class="entries-list">
                @for (entry of filteredAvailableEntries(); track entry.id) {
                  <app-entry-item
                    [entry]="entry"
                    [isInOtherNode]="isInOtherNode(entry)"
                    [isSelected]="isEntrySelected(entry.id)"
                    [showCheckbox]="true"
                    [otherNodesNames]="getNodesForEntry(entry)"
                    (select)="onEntryClick($event.event, $event.entry)"
                    (doubleClick)="assignEntry($event)"
                    (checkboxChange)="toggleEntrySelection($event.id)"
                    (dragStart)="onEntryDragStart($event.event, $event.entry, false)">
                  </app-entry-item>
                } @empty {
                  <p class="empty-hint">No entries match your filters</p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Node Edit Modal -->
      @if (showNodeModal()) {
        <app-node-form-modal
          [editingNode]="editingNode()"
          [parentId]="parentNodeIdForNew()"
          [initialName]="nodeName()"
          [initialDescription]="nodeDescription()"
          [initialIcon]="nodeIcon()"
          (save)="onNodeSave($event)"
          (close)="closeNodeModal()">
        </app-node-form-modal>
      }
    </div>
  `,
  styleUrl: './asset-editor.component.scss'
})
export class AssetEditorComponent implements OnInit {
  readonly store = inject(AssetDictionaryStore);
  readonly catalogStore = inject(CatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  // State signals
  readonly searchQuery = signal('');
  readonly selectedNodeId = signal<string | null>(null);
  readonly dragOverNodeId = signal<string | null>(null);
  readonly showNodeModal = signal(false);
  readonly editingNode = signal<AssetNode | null>(null);
  readonly parentNodeIdForNew = signal<string | null>(null);
  readonly selectedLabelFilter = signal<string | null>(null);
  readonly selectedEntryIds = signal<Set<string>>(new Set());

  // Node form state
  readonly nodeName = signal('');
  readonly nodeDescription = signal('');
  readonly nodeIcon = signal('folder');

  // Expand state stored locally
  private expandState = new Map<string, boolean>();
  private lastClickedEntryId: string | null = null;
  private draggedEntry: CatalogEntry | null = null;
  private draggedNode: AssetNode | null = null;

  // Computed values
  readonly dictionary = this.store.selectedDictionary;

  readonly flatNodes = computed(() => {
    const dict = this.dictionary();
    return dict ? dict.nodes : [];
  });

  readonly treeNodes = computed(() => {
    const nodes = this.store.selectedDictionaryTree();
    return this.applyExpandState(nodes);
  });

  readonly availableLabels = computed(() => {
    const entries = this.catalogStore.entries();
    const labelMap = new Map<string, Label>();

    entries.forEach(entry => {
      entry.labels?.forEach(label => {
        if (!labelMap.has(label.id)) {
          labelMap.set(label.id, label);
        }
      });
    });

    return Array.from(labelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly assignedEntries = computed(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) return [];

    const node = this.flatNodes().find(n => n.id === nodeId);
    if (!node) return [];

    const entries = this.catalogStore.entries();
    return entries.filter(entry => node.entryIds.includes(entry.id));
  });

  readonly filteredAvailableEntries = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const labelFilter = this.selectedLabelFilter();
    const nodeId = this.selectedNodeId();
    const node = nodeId ? this.flatNodes().find(n => n.id === nodeId) : null;
    const assignedIds = new Set(node?.entryIds || []);

    let entries = this.catalogStore.entries();

    // Filter out assigned ones
    entries = entries.filter(entry => !assignedIds.has(entry.id));

    // Apply label filter
    if (labelFilter) {
      entries = entries.filter(entry =>
        entry.labels?.some(label => label.id === labelFilter)
      );
    }

    // Apply search
    if (query) {
      entries = entries.filter(entry =>
        entry.name.toLowerCase().includes(query) ||
        entry.dataType.toLowerCase().includes(query) ||
        entry.sourceConnection.name.toLowerCase().includes(query)
      );
    }

    return entries;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.selectDictionary(id);
      if (this.catalogStore.entries().length === 0) {
        this.catalogStore.loadAll();
      }
    } else {
      this.router.navigate(['/assets']);
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/assets']);
  }

  // Search
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  // Label filter
  setLabelFilter(labelId: string | null): void {
    this.selectedLabelFilter.set(labelId);
  }

  // Tree node actions
  onTreeNodeAction(action: TreeNodeAction): void {
    switch (action.type) {
      case 'select':
        this.selectedNodeId.set(action.node.id);
        break;
      case 'toggle-expand':
        this.toggleExpand(action.node);
        break;
      case 'add-child':
        this.addChildNode(action.node);
        break;
      case 'edit':
        this.editNode(action.node);
        break;
      case 'delete':
        this.deleteNode(action.node);
        break;
    }
  }

  onTreeNodeDrag(dragEvent: TreeNodeDragEvent): void {
    switch (dragEvent.type) {
      case 'start':
        this.draggedNode = dragEvent.node;
        dragEvent.event.dataTransfer?.setData('text/plain', dragEvent.node.id);
        break;
      case 'end':
        this.draggedNode = null;
        this.dragOverNodeId.set(null);
        break;
      case 'over':
        if (this.draggedNode && this.draggedNode.id !== dragEvent.node.id) {
          this.dragOverNodeId.set(dragEvent.node.id);
        }
        break;
      case 'leave':
        this.dragOverNodeId.set(null);
        break;
      case 'drop':
        this.handleDropOnNode(dragEvent.node);
        break;
    }
  }

  // Node helpers
  getSelectedNode(): AssetNode | undefined {
    const id = this.selectedNodeId();
    return id ? this.flatNodes().find(n => n.id === id) : undefined;
  }

  private toggleExpand(node: AssetNode): void {
    const current = this.expandState.get(node.id) ?? true;
    this.expandState.set(node.id, !current);
    this.store.selectDictionary(this.dictionary()?.id || null);
  }

  private applyExpandState(nodes: AssetNode[]): AssetNode[] {
    return nodes.map(node => ({
      ...node,
      expanded: this.expandState.get(node.id) ?? true,
      children: node.children ? this.applyExpandState(node.children) : undefined
    }));
  }

  // Node CRUD
  addRootNode(): void {
    this.openNodeModal(null, null);
  }

  addChildNode(parent: AssetNode): void {
    this.openNodeModal(null, parent.id);
  }

  editNode(node: AssetNode): void {
    this.openNodeModal(node, null);
  }

  async deleteNode(node: AssetNode): Promise<void> {
    const dict = this.dictionary();
    if (!dict) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Node',
      message: `Delete "${node.name}" and all its children?`,
      confirmText: 'Delete',
      danger: true
    });

    if (confirmed) {
      this.store.deleteNode(dict.id, node.id);
      if (this.selectedNodeId() === node.id) {
        this.selectedNodeId.set(null);
      }
    }
  }

  private openNodeModal(node: AssetNode | null, parentId: string | null): void {
    this.editingNode.set(node);
    this.parentNodeIdForNew.set(parentId);
    this.nodeName.set(node?.name || '');
    this.nodeDescription.set(node?.description || '');
    this.nodeIcon.set(node?.icon || 'folder');
    this.showNodeModal.set(true);
  }

  closeNodeModal(): void {
    this.showNodeModal.set(false);
    this.editingNode.set(null);
    this.parentNodeIdForNew.set(null);
  }

  onNodeSave(event: NodeSaveEvent): void {
    const dict = this.dictionary();
    if (!dict) return;

    if (event.editingNode) {
      this.store.updateNode({
        id: event.editingNode.id,
        dictionaryId: dict.id,
        name: event.data.name,
        description: event.data.description,
        icon: event.data.icon
      });
    } else {
      this.store.addNode({
        dictionaryId: dict.id,
        name: event.data.name,
        description: event.data.description,
        icon: event.data.icon,
        parentId: event.parentId
      });
    }

    this.closeNodeModal();
  }

  // Drag & Drop for root
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropOnRoot(event: DragEvent): void {
    event.preventDefault();

    const dict = this.dictionary();
    if (!dict || !this.draggedNode) return;

    this.store.moveNode(dict.id, this.draggedNode.id, null, 0);
    this.draggedNode = null;
  }

  private handleDropOnNode(targetNode: AssetNode): void {
    this.dragOverNodeId.set(null);

    const dict = this.dictionary();
    if (!dict) return;

    if (this.draggedNode) {
      this.store.moveNode(dict.id, this.draggedNode.id, targetNode.id, 0);
      this.draggedNode = null;
    } else if (this.draggedEntry) {
      this.assignEntriesToNode(targetNode.id);
    }
  }

  // Entry drag & drop
  onEntryDragStart(event: DragEvent, entry: CatalogEntry, _fromAssigned: boolean): void {
    this.draggedEntry = entry;

    const selectedIds = this.selectedEntryIds();
    const idsToTransfer = selectedIds.has(entry.id) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [entry.id];

    event.dataTransfer?.setData('text/plain', JSON.stringify(idsToTransfer));

    if (idsToTransfer.length > 1 && event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDropEntry(event: DragEvent): void {
    event.preventDefault();

    const dict = this.dictionary();
    const nodeId = this.selectedNodeId();
    if (!dict || !nodeId || !this.draggedEntry) return;

    this.assignEntriesToNode(nodeId);
    this.draggedEntry = null;
  }

  private assignEntriesToNode(nodeId: string): void {
    const dict = this.dictionary();
    if (!dict) return;

    const selectedIds = this.selectedEntryIds();
    const idsToAssign = this.draggedEntry
      ? (selectedIds.has(this.draggedEntry.id) && selectedIds.size > 1
        ? Array.from(selectedIds)
        : [this.draggedEntry.id])
      : [];

    idsToAssign.forEach(entryId => {
      this.store.addEntryToNode(dict.id, nodeId, entryId);
    });

    this.clearSelection();
  }

  // Entry assignment
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

  assignSelectedEntries(): void {
    const dict = this.dictionary();
    const nodeId = this.selectedNodeId();
    if (!dict || !nodeId) return;

    this.selectedEntryIds().forEach(entryId => {
      this.store.addEntryToNode(dict.id, nodeId, entryId);
    });

    this.clearSelection();
  }

  // Entry helpers
  isInOtherNode(entry: CatalogEntry): boolean {
    const nodeId = this.selectedNodeId();
    return this.flatNodes().some(node => node.id !== nodeId && node.entryIds.includes(entry.id));
  }

  getNodesForEntry(entry: CatalogEntry): string {
    return this.flatNodes()
      .filter(node => node.entryIds.includes(entry.id))
      .map(node => node.name)
      .join(', ');
  }

  // Multi-selection
  isEntrySelected(entryId: string): boolean {
    return this.selectedEntryIds().has(entryId);
  }

  toggleEntrySelection(entryId: string): void {
    const current = this.selectedEntryIds();
    const newSet = new Set(current);

    if (newSet.has(entryId)) {
      newSet.delete(entryId);
    } else {
      newSet.add(entryId);
    }

    this.selectedEntryIds.set(newSet);
    this.lastClickedEntryId = entryId;
  }

  onEntryClick(event: MouseEvent, entry: CatalogEntry): void {
    if ((event.target as HTMLElement).classList.contains('entry-checkbox')) {
      return;
    }

    // Shift+click for range selection
    if (event.shiftKey && this.lastClickedEntryId) {
      this.handleRangeSelection(entry);
      return;
    }

    // Ctrl/Cmd+click for toggle
    if (event.ctrlKey || event.metaKey) {
      this.toggleEntrySelection(entry.id);
      return;
    }

    // Regular click
    if (!this.isEntrySelected(entry.id)) {
      this.selectedEntryIds.set(new Set([entry.id]));
      this.lastClickedEntryId = entry.id;
    }
  }

  private handleRangeSelection(entry: CatalogEntry): void {
    const entries = this.filteredAvailableEntries();
    const lastIndex = entries.findIndex(e => e.id === this.lastClickedEntryId);
    const currentIndex = entries.findIndex(e => e.id === entry.id);

    if (lastIndex !== -1 && currentIndex !== -1) {
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const newSet = new Set(this.selectedEntryIds());

      for (let i = start; i <= end; i++) {
        newSet.add(entries[i].id);
      }

      this.selectedEntryIds.set(newSet);
    }
  }

  clearSelection(): void {
    this.selectedEntryIds.set(new Set());
    this.lastClickedEntryId = null;
  }
}

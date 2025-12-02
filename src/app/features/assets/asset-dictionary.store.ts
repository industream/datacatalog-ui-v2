import { Injectable, signal, computed } from '@angular/core';
import {
  AssetDictionary,
  AssetNode,
  AssetDictionaryCreateRequest,
  AssetDictionaryAmendRequest,
  AssetNodeCreateRequest,
  AssetNodeAmendRequest,
  AssetDictionaryTemplate,
  AssetTemplateNode
} from '../../core/models';

const STORAGE_KEY = 'dc-asset-dictionaries';

@Injectable({ providedIn: 'root' })
export class AssetDictionaryStore {
  private readonly _dictionaries = signal<AssetDictionary[]>([]);
  private readonly _loading = signal(false);
  private readonly _selectedDictionaryId = signal<string | null>(null);

  readonly dictionaries = this._dictionaries.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly selectedDictionary = computed(() => {
    const id = this._selectedDictionaryId();
    if (!id) return null;
    return this._dictionaries().find(d => d.id === id) || null;
  });

  // Build tree structure from flat nodes
  readonly selectedDictionaryTree = computed(() => {
    const dict = this.selectedDictionary();
    if (!dict) return [];
    return this.buildTree(dict.nodes);
  });

  constructor() {
    this.loadFromStorage();
  }

  // Load dictionaries from localStorage
  loadDictionaries(): void {
    this._loading.set(true);
    // Simulate async loading
    setTimeout(() => {
      this.loadFromStorage();
      this._loading.set(false);
    }, 100);
  }

  selectDictionary(id: string | null): void {
    this._selectedDictionaryId.set(id);
  }

  // Create a new dictionary
  createDictionary(request: AssetDictionaryCreateRequest, template?: AssetDictionaryTemplate): void {
    const now = new Date().toISOString();
    const id = this.generateId();

    let nodes: AssetNode[] = [];
    if (template) {
      nodes = this.generateNodesFromTemplate(template.structure);
    }

    const newDict: AssetDictionary = {
      id,
      name: request.name,
      description: request.description,
      icon: request.icon,
      color: request.color,
      createdAt: now,
      updatedAt: now,
      templateId: request.templateId,
      nodes
    };

    this._dictionaries.update(dicts => [...dicts, newDict]);
    this.saveToStorage();
  }

  // Update dictionary metadata
  updateDictionary(request: AssetDictionaryAmendRequest): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== request.id) return d;
        return {
          ...d,
          name: request.name ?? d.name,
          description: request.description ?? d.description,
          icon: request.icon ?? d.icon,
          color: request.color ?? d.color,
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Delete a dictionary
  deleteDictionary(id: string): void {
    this._dictionaries.update(dicts => dicts.filter(d => d.id !== id));
    if (this._selectedDictionaryId() === id) {
      this._selectedDictionaryId.set(null);
    }
    this.saveToStorage();
  }

  // Add a node to a dictionary
  addNode(request: AssetNodeCreateRequest): void {
    const nodeId = this.generateId();
    const newNode: AssetNode = {
      id: nodeId,
      name: request.name,
      description: request.description,
      icon: request.icon,
      parentId: request.parentId,
      order: request.order ?? 0,
      entryIds: []
    };

    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== request.dictionaryId) return d;
        return {
          ...d,
          nodes: [...d.nodes, newNode],
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Update a node
  updateNode(request: AssetNodeAmendRequest): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== request.dictionaryId) return d;
        return {
          ...d,
          nodes: d.nodes.map(n => {
            if (n.id !== request.id) return n;
            return {
              ...n,
              name: request.name ?? n.name,
              description: request.description ?? n.description,
              icon: request.icon ?? n.icon,
              parentId: request.parentId !== undefined ? request.parentId : n.parentId,
              order: request.order ?? n.order
            };
          }),
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Delete a node (and all children)
  deleteNode(dictionaryId: string, nodeId: string): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== dictionaryId) return d;

        // Find all descendant node IDs to remove
        const idsToRemove = this.getDescendantIds(d.nodes, nodeId);
        idsToRemove.add(nodeId);

        return {
          ...d,
          nodes: d.nodes.filter(n => !idsToRemove.has(n.id)),
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Assign entries (tags) to a node
  assignEntries(dictionaryId: string, nodeId: string, entryIds: string[]): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== dictionaryId) return d;
        return {
          ...d,
          nodes: d.nodes.map(n => {
            if (n.id !== nodeId) return n;
            return { ...n, entryIds };
          }),
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Add entry to a node
  addEntryToNode(dictionaryId: string, nodeId: string, entryId: string): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== dictionaryId) return d;
        return {
          ...d,
          nodes: d.nodes.map(n => {
            if (n.id !== nodeId) return n;
            if (n.entryIds.includes(entryId)) return n;
            return { ...n, entryIds: [...n.entryIds, entryId] };
          }),
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Remove entry from a node
  removeEntryFromNode(dictionaryId: string, nodeId: string, entryId: string): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== dictionaryId) return d;
        return {
          ...d,
          nodes: d.nodes.map(n => {
            if (n.id !== nodeId) return n;
            return { ...n, entryIds: n.entryIds.filter(id => id !== entryId) };
          }),
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Move a node to a new parent (for drag & drop)
  moveNode(dictionaryId: string, nodeId: string, newParentId: string | null, newOrder: number): void {
    this._dictionaries.update(dicts =>
      dicts.map(d => {
        if (d.id !== dictionaryId) return d;

        // Check for circular reference
        if (newParentId) {
          const parentAncestors = this.getAncestorIds(d.nodes, newParentId);
          if (parentAncestors.has(nodeId)) {
            console.error('Cannot move node: would create circular reference');
            return d;
          }
        }

        return {
          ...d,
          nodes: d.nodes.map(n => {
            if (n.id !== nodeId) return n;
            return { ...n, parentId: newParentId, order: newOrder };
          }),
          updatedAt: new Date().toISOString()
        };
      })
    );
    this.saveToStorage();
  }

  // Build tree structure from flat nodes
  private buildTree(nodes: AssetNode[], parentId: string | null = null): AssetNode[] {
    return nodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(n => ({
        ...n,
        children: this.buildTree(nodes, n.id)
      }));
  }

  // Get all descendant IDs of a node
  private getDescendantIds(nodes: AssetNode[], nodeId: string): Set<string> {
    const ids = new Set<string>();
    const children = nodes.filter(n => n.parentId === nodeId);
    for (const child of children) {
      ids.add(child.id);
      const childDescendants = this.getDescendantIds(nodes, child.id);
      childDescendants.forEach(id => ids.add(id));
    }
    return ids;
  }

  // Get all ancestor IDs of a node
  private getAncestorIds(nodes: AssetNode[], nodeId: string): Set<string> {
    const ids = new Set<string>();
    let currentId: string | null = nodeId;
    while (currentId) {
      const node = nodes.find(n => n.id === currentId);
      if (!node || !node.parentId) break;
      ids.add(node.parentId);
      currentId = node.parentId;
    }
    return ids;
  }

  // Generate nodes from a template
  private generateNodesFromTemplate(structure: AssetTemplateNode[], parentId: string | null = null): AssetNode[] {
    const nodes: AssetNode[] = [];

    structure.forEach((tplNode, index) => {
      const nodeId = this.generateId();
      nodes.push({
        id: nodeId,
        name: tplNode.name,
        description: tplNode.description,
        icon: tplNode.icon,
        parentId,
        order: index,
        entryIds: []
      });

      if (tplNode.children) {
        const childNodes = this.generateNodesFromTemplate(tplNode.children, nodeId);
        nodes.push(...childNodes);
      }
    });

    return nodes;
  }

  // Generate a unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this._dictionaries.set(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to load asset dictionaries from storage:', e);
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._dictionaries()));
    } catch (e) {
      console.error('Failed to save asset dictionaries to storage:', e);
    }
  }
}

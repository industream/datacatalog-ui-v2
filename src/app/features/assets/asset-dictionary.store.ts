import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
import { ApiService, PollingService } from '../../core/services';

@Injectable({ providedIn: 'root' })
export class AssetDictionaryStore implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly polling = inject(PollingService);
  private readonly POLLING_KEY = 'asset-dictionary-store';

  private readonly _dictionaries = signal<AssetDictionary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedDictionaryId = signal<string | null>(null);

  readonly dictionaries = this._dictionaries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly selectedDictionary = computed(() => {
    const id = this._selectedDictionaryId();
    if (!id) return null;
    return this._dictionaries().find(dictionary => dictionary.id === id) || null;
  });

  readonly selectedDictionaryTree = computed(() => {
    const dictionary = this.selectedDictionary();
    if (!dictionary) return [];
    return this.buildTree(dictionary.nodes);
  });

  constructor() {
    this.loadDictionaries();
    // Register for polling
    this.polling.register(this.POLLING_KEY, () => this.refreshSilently());
  }

  ngOnDestroy(): void {
    this.polling.unregister(this.POLLING_KEY);
  }

  // Silent refresh (no loading indicator) for polling
  private async refreshSilently(): Promise<void> {
    try {
      const dictionaries = await firstValueFrom(
        this.api.getAssetDictionaries({ includeNodes: true })
      );
      this._dictionaries.set(dictionaries);
    } catch {
      // Silently fail on polling errors
    }
  }

  // ============ Error Handling Helper ============

  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    showLoading = false
  ): Promise<T | null> {
    this._error.set(null);
    if (showLoading) {
      this._loading.set(true);
    }

    try {
      return await operation();
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      this._error.set(errorMessage);
      return null;
    } finally {
      if (showLoading) {
        this._loading.set(false);
      }
    }
  }

  // ============ Dictionary State Updates ============

  private updateDictionaryInState(
    dictionaryId: string,
    updater: (dictionary: AssetDictionary) => AssetDictionary
  ): void {
    this._dictionaries.update(dictionaries =>
      dictionaries.map(dictionary =>
        dictionary.id === dictionaryId ? updater(dictionary) : dictionary
      )
    );
  }

  private updateNodeInDictionary(
    dictionaryId: string,
    nodeUpdater: (nodes: AssetNode[]) => AssetNode[]
  ): void {
    this.updateDictionaryInState(dictionaryId, dictionary => ({
      ...dictionary,
      nodes: nodeUpdater(dictionary.nodes)
    }));
  }

  // ============ Public API ============

  async loadDictionaries(): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const dictionaries = await firstValueFrom(
          this.api.getAssetDictionaries({ includeNodes: true })
        );
        this._dictionaries.set(dictionaries);
        return dictionaries;
      },
      'Failed to load asset dictionaries',
      true
    );
  }

  selectDictionary(id: string | null): void {
    this._selectedDictionaryId.set(id);
  }

  async createDictionary(
    request: AssetDictionaryCreateRequest,
    template?: AssetDictionaryTemplate
  ): Promise<AssetDictionary | null> {
    return this.executeWithErrorHandling(
      async () => {
        const [newDictionary] = await firstValueFrom(
          this.api.createAssetDictionaries([request])
        );

        if (template && newDictionary) {
          await this.createNodesFromTemplate(newDictionary.id, template.structure);
          await this.loadDictionaries();
          return this._dictionaries().find(d => d.id === newDictionary.id) || newDictionary;
        }

        this._dictionaries.update(dictionaries => [...dictionaries, newDictionary]);
        return newDictionary;
      },
      'Failed to create asset dictionary',
      true
    );
  }

  async updateDictionary(request: AssetDictionaryAmendRequest): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const updated = await firstValueFrom(this.api.updateAssetDictionary(request));
        this.updateDictionaryInState(request.id, dictionary => ({
          ...dictionary,
          ...updated
        }));
        return updated;
      },
      'Failed to update asset dictionary'
    );
  }

  async deleteDictionary(id: string): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(this.api.deleteAssetDictionaries([id]));
        this._dictionaries.update(dictionaries =>
          dictionaries.filter(dictionary => dictionary.id !== id)
        );

        if (this._selectedDictionaryId() === id) {
          this._selectedDictionaryId.set(null);
        }
      },
      'Failed to delete asset dictionary'
    );
  }

  async addNode(request: AssetNodeCreateRequest): Promise<AssetNode | null> {
    return this.executeWithErrorHandling(
      async () => {
        const newNode = await firstValueFrom(
          this.api.createAssetNode(request.dictionaryId, {
            name: request.name,
            description: request.description,
            icon: request.icon,
            parentId: request.parentId,
            order: request.order ?? 0
          })
        );

        this.updateNodeInDictionary(request.dictionaryId, nodes => [
          ...nodes,
          { ...newNode, entryIds: newNode.entryIds || [] }
        ]);

        return newNode;
      },
      'Failed to add node'
    );
  }

  async updateNode(request: AssetNodeAmendRequest): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const updated = await firstValueFrom(
          this.api.updateAssetNode(request.dictionaryId, {
            id: request.id,
            name: request.name,
            description: request.description,
            icon: request.icon,
            parentId: request.parentId,
            order: request.order
          })
        );

        this.updateNodeInDictionary(request.dictionaryId, nodes =>
          nodes.map(node => node.id === request.id ? { ...node, ...updated } : node)
        );

        return updated;
      },
      'Failed to update node'
    );
  }

  async deleteNode(dictionaryId: string, nodeId: string): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(this.api.deleteAssetNode(dictionaryId, nodeId));

        this.updateDictionaryInState(dictionaryId, dictionary => {
          const idsToRemove = this.getDescendantIds(dictionary.nodes, nodeId);
          idsToRemove.add(nodeId);

          return {
            ...dictionary,
            nodes: dictionary.nodes.filter(node => !idsToRemove.has(node.id))
          };
        });
      },
      'Failed to delete node'
    );
  }

  async assignEntries(
    dictionaryId: string,
    nodeId: string,
    entryIds: string[]
  ): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(
          this.api.assignEntriesToNode(dictionaryId, nodeId, entryIds)
        );

        this.updateNodeInDictionary(dictionaryId, nodes =>
          nodes.map(node => node.id === nodeId ? { ...node, entryIds } : node)
        );
      },
      'Failed to assign entries'
    );
  }

  async addEntryToNode(
    dictionaryId: string,
    nodeId: string,
    entryId: string
  ): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(
          this.api.addEntryToNode(dictionaryId, nodeId, entryId)
        );

        this.updateNodeInDictionary(dictionaryId, nodes =>
          nodes.map(node => {
            if (node.id !== nodeId) return node;
            if (node.entryIds.includes(entryId)) return node;
            return { ...node, entryIds: [...node.entryIds, entryId] };
          })
        );
      },
      'Failed to add entry to node'
    );
  }

  async removeEntryFromNode(
    dictionaryId: string,
    nodeId: string,
    entryId: string
  ): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(
          this.api.removeEntryFromNode(dictionaryId, nodeId, entryId)
        );

        this.updateNodeInDictionary(dictionaryId, nodes =>
          nodes.map(node => {
            if (node.id !== nodeId) return node;
            return { ...node, entryIds: node.entryIds.filter(id => id !== entryId) };
          })
        );
      },
      'Failed to remove entry from node'
    );
  }

  async moveNode(
    dictionaryId: string,
    nodeId: string,
    newParentId: string | null,
    newOrder: number
  ): Promise<void> {
    // Validate against circular reference
    const dictionary = this._dictionaries().find(d => d.id === dictionaryId);
    if (dictionary && newParentId) {
      const parentAncestors = this.getAncestorIds(dictionary.nodes, newParentId);
      if (parentAncestors.has(nodeId)) {
        console.error('Cannot move node: would create circular reference');
        this._error.set('Cannot move node: would create circular reference');
        return;
      }
    }

    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(
          this.api.moveAssetNode(dictionaryId, nodeId, { newParentId, newOrder })
        );

        this.updateNodeInDictionary(dictionaryId, nodes =>
          nodes.map(node => {
            if (node.id !== nodeId) return node;
            return { ...node, parentId: newParentId, order: newOrder };
          })
        );
      },
      'Failed to move node'
    );
  }

  // ============ Tree Helpers ============

  private buildTree(nodes: AssetNode[], parentId: string | null = null): AssetNode[] {
    return nodes
      .filter(node => (node.parentId ?? null) === parentId)
      .sort((a, b) => a.order - b.order)
      .map(node => ({
        ...node,
        children: this.buildTree(nodes, node.id)
      }));
  }

  private getDescendantIds(nodes: AssetNode[], nodeId: string): Set<string> {
    const ids = new Set<string>();
    const children = nodes.filter(node => node.parentId === nodeId);

    for (const child of children) {
      ids.add(child.id);
      const childDescendants = this.getDescendantIds(nodes, child.id);
      childDescendants.forEach(id => ids.add(id));
    }

    return ids;
  }

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

  // ============ Template Helpers ============

  private async createNodesFromTemplate(
    dictionaryId: string,
    structure: AssetTemplateNode[],
    parentId: string | null = null
  ): Promise<void> {
    for (let index = 0; index < structure.length; index++) {
      const templateNode = structure[index];

      const createdNode = await firstValueFrom(
        this.api.createAssetNode(dictionaryId, {
          name: templateNode.name,
          description: templateNode.description,
          icon: templateNode.icon,
          parentId,
          order: index
        })
      );

      if (templateNode.children && templateNode.children.length > 0) {
        await this.createNodesFromTemplate(
          dictionaryId,
          templateNode.children,
          createdNode.id
        );
      }
    }
  }
}

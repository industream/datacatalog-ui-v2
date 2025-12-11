import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AssetDictionary,
  AssetDictionaryCreateRequest,
  AssetDictionaryAmendRequest,
  AssetNode as ClientAssetNode,
  AssetNodeCreateRequest as ClientAssetNodeCreateRequest,
  AssetNodeAmendRequest as ClientAssetNodeAmendRequest
} from '@industream/datacatalog-client/dto';
import { ApiService, PollingService, ToastService, ConfigService } from '../core/services';

// UI-only types for template functionality
export interface AssetTemplateNode {
  name: string;
  icon?: string;
  description?: string;
  children?: AssetTemplateNode[];
}

export interface AssetDictionaryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  structure: AssetTemplateNode[];
}

// Extended types that include dictionaryId for internal use
export interface AssetNodeCreateRequest extends ClientAssetNodeCreateRequest {
  dictionaryId: string;
}

export interface AssetNodeAmendRequest extends ClientAssetNodeAmendRequest {
  dictionaryId: string;
}

// Extended AssetNode type to support UI features like expanded state
export type AssetNode = ClientAssetNode & {
  expanded?: boolean;
  children?: AssetNode[];
}

@Injectable({ providedIn: 'root' })
export class AssetDictionaryStore implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly polling = inject(PollingService);
  private readonly toastService = inject(ToastService);
  private readonly configService = inject(ConfigService);
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
    console.log('[AssetDictionaryStore] Polling refresh triggered');
    // Wait for config to be loaded before making API calls
    await this.configService.waitForConfig();

    try {
      const dictionaries = await firstValueFrom(
        this.api.getAssetDictionaries({ includeNodes: true })
      );
      console.log('[AssetDictionaryStore] Polling refresh loaded:', dictionaries?.length);
      this._dictionaries.set(dictionaries);
    } catch (error) {
      console.error('[AssetDictionaryStore] Polling refresh error:', error);
    }
  }

  // ============ Error Handling Helper ============

  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    showLoading = false,
    showToast = true
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
      if (showToast) {
        this.toastService.error(errorMessage);
      }
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
    // Wait for config to be loaded before making API calls
    await this.configService.waitForConfig();

    console.log('[AssetDictionaryStore] Loading dictionaries from:', this.configService.apiUrl);
    console.log('[AssetDictionaryStore] Config loaded:', this.configService.isLoaded);

    try {
      this._loading.set(true);
      this._error.set(null);

      console.log('[AssetDictionaryStore] Making API call...');
      const observable = this.api.getAssetDictionaries({ includeNodes: true });
      console.log('[AssetDictionaryStore] Observable created:', observable);

      const dictionaries = await firstValueFrom(observable);
      console.log('[AssetDictionaryStore] Loaded dictionaries:', dictionaries?.length, dictionaries);

      if (dictionaries && dictionaries.length > 0) {
        this._dictionaries.set(dictionaries);
      } else {
        console.warn('[AssetDictionaryStore] No dictionaries returned or empty array');
        this._dictionaries.set(dictionaries || []);
      }
    } catch (error) {
      console.error('[AssetDictionaryStore] Error loading dictionaries:', error);
      this._error.set('Failed to load asset dictionaries');
      this.toastService.error('Failed to load asset dictionaries');
    } finally {
      this._loading.set(false);
    }
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
    await this.addEntriesToNode(dictionaryId, nodeId, [entryId]);
  }

  async addEntriesToNode(
    dictionaryId: string,
    nodeId: string,
    entryIds: string[]
  ): Promise<void> {
    if (entryIds.length === 0) return;

    // Get current entries for the node
    const dictionary = this._dictionaries().find(d => d.id === dictionaryId);
    const node = dictionary?.nodes.find(n => n.id === nodeId);
    const currentEntryIds = node?.entryIds || [];

    // Merge with new entries (avoid duplicates)
    const newEntryIds = [...new Set([...currentEntryIds, ...entryIds])];

    await this.executeWithErrorHandling(
      async () => {
        await firstValueFrom(
          this.api.assignEntriesToNode(dictionaryId, nodeId, newEntryIds)
        );

        this.updateNodeInDictionary(dictionaryId, nodes =>
          nodes.map(n => n.id === nodeId ? { ...n, entryIds: newEntryIds } : n)
        );
      },
      'Failed to add entries to node'
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
          this.api.moveAssetNode(dictionaryId, nodeId, { newParentId: newParentId ?? undefined, newOrder })
        );

        this.updateNodeInDictionary(dictionaryId, nodes =>
          nodes.map(node => {
            if (node.id !== nodeId) return node;
            return { ...node, parentId: newParentId ?? undefined, order: newOrder };
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
          parentId: parentId ?? undefined,
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

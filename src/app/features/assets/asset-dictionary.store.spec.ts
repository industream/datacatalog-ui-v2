import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AssetDictionaryStore } from './asset-dictionary.store';
import { ApiService, PollingService, ToastService } from '../../core/services';
import { AssetDictionary, AssetNode } from '../../core/models';

describe('AssetDictionaryStore', () => {
  let store: AssetDictionaryStore;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let pollingServiceSpy: jasmine.SpyObj<PollingService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockNodes: AssetNode[] = [
    {
      id: 'node1',
      dictionaryId: 'dict1',
      name: 'Root Node',
      icon: 'folder',
      parentId: null,
      order: 0,
      entryIds: ['entry1', 'entry2']
    },
    {
      id: 'node2',
      dictionaryId: 'dict1',
      name: 'Child Node',
      icon: 'factory',
      parentId: 'node1',
      order: 0,
      entryIds: ['entry3']
    }
  ];

  const mockDictionaries: AssetDictionary[] = [
    {
      id: 'dict1',
      name: 'Dictionary 1',
      description: 'Test dictionary',
      icon: 'category',
      color: '#0f62fe',
      nodes: mockNodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'dict2',
      name: 'Dictionary 2',
      icon: 'inventory_2',
      color: '#24a148',
      nodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getAssetDictionaries',
      'createAssetDictionaries',
      'updateAssetDictionary',
      'deleteAssetDictionaries',
      'createAssetNode',
      'updateAssetNode',
      'deleteAssetNode',
      'assignEntriesToNode',
      'removeEntryFromNode',
      'moveAssetNode'
    ]);

    pollingServiceSpy = jasmine.createSpyObj('PollingService', ['register', 'unregister']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    // Default return values
    apiServiceSpy.getAssetDictionaries.and.returnValue(of(mockDictionaries));

    TestBed.configureTestingModule({
      providers: [
        AssetDictionaryStore,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });

    store = TestBed.inject(AssetDictionaryStore);
  });

  afterEach(() => {
    store.ngOnDestroy();
  });

  describe('initial state', () => {
    it('should register with polling service', () => {
      expect(pollingServiceSpy.register).toHaveBeenCalledWith(
        'asset-dictionary-store',
        jasmine.any(Function)
      );
    });

    it('should load dictionaries on init', fakeAsync(() => {
      tick();
      expect(store.dictionaries()).toEqual(mockDictionaries);
    }));

    it('should not be loading after init', fakeAsync(() => {
      tick();
      expect(store.loading()).toBeFalse();
    }));

    it('should have no error', fakeAsync(() => {
      tick();
      expect(store.error()).toBeNull();
    }));
  });

  describe('loadDictionaries', () => {
    it('should load dictionaries from API', fakeAsync(() => {
      store.loadDictionaries();
      tick();

      expect(apiServiceSpy.getAssetDictionaries).toHaveBeenCalledWith({ includeNodes: true });
      expect(store.dictionaries()).toEqual(mockDictionaries);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.getAssetDictionaries.and.returnValue(throwError(() => new Error('Network error')));

      store.loadDictionaries();
      tick();

      expect(store.error()).toBe('Failed to load asset dictionaries');
      expect(toastServiceSpy.error).toHaveBeenCalledWith('Failed to load asset dictionaries');
    }));
  });

  describe('selectDictionary', () => {
    it('should set selected dictionary', fakeAsync(() => {
      tick(); // Wait for initial load
      store.selectDictionary('dict1');

      expect(store.selectedDictionary()).toEqual(mockDictionaries[0]);
    }));

    it('should return null for non-existent dictionary', fakeAsync(() => {
      tick();
      store.selectDictionary('nonexistent');

      expect(store.selectedDictionary()).toBeNull();
    }));

    it('should return null when null is passed', fakeAsync(() => {
      tick();
      store.selectDictionary('dict1');
      store.selectDictionary(null);

      expect(store.selectedDictionary()).toBeNull();
    }));
  });

  describe('selectedDictionaryTree', () => {
    it('should build tree structure from flat nodes', fakeAsync(() => {
      tick();
      store.selectDictionary('dict1');

      const tree = store.selectedDictionaryTree();
      expect(tree.length).toBe(1); // One root node
      expect(tree[0].id).toBe('node1');
      expect(tree[0].children?.length).toBe(1); // One child
      expect(tree[0].children?.[0].id).toBe('node2');
    }));

    it('should return empty array when no dictionary selected', fakeAsync(() => {
      tick();
      store.selectDictionary(null);

      expect(store.selectedDictionaryTree()).toEqual([]);
    }));
  });

  describe('createDictionary', () => {
    it('should create dictionary and add to list', fakeAsync(() => {
      tick();
      const newDict: AssetDictionary = {
        id: 'dict3',
        name: 'New Dictionary',
        icon: 'folder',
        color: '#da1e28',
        nodes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      apiServiceSpy.createAssetDictionaries.and.returnValue(of([newDict]));

      store.createDictionary({ name: 'New Dictionary', icon: 'folder', color: '#da1e28' });
      tick();

      expect(store.dictionaries().length).toBe(3);
      expect(store.dictionaries().find(d => d.id === 'dict3')).toBeTruthy();
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.createAssetDictionaries.and.returnValue(throwError(() => new Error()));

      store.createDictionary({ name: 'Test', icon: 'folder', color: '#000' });
      tick();

      expect(store.error()).toBe('Failed to create asset dictionary');
      expect(toastServiceSpy.error).toHaveBeenCalled();
    }));
  });

  describe('updateDictionary', () => {
    it('should update dictionary in list', fakeAsync(() => {
      tick();
      const updated = { ...mockDictionaries[0], name: 'Updated Name' };
      apiServiceSpy.updateAssetDictionary.and.returnValue(of(updated));

      store.updateDictionary({ id: 'dict1', name: 'Updated Name' });
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      expect(dict?.name).toBe('Updated Name');
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.updateAssetDictionary.and.returnValue(throwError(() => new Error()));

      store.updateDictionary({ id: 'dict1', name: 'Test' });
      tick();

      expect(store.error()).toBe('Failed to update asset dictionary');
    }));
  });

  describe('deleteDictionary', () => {
    it('should remove dictionary from list', fakeAsync(() => {
      tick();
      apiServiceSpy.deleteAssetDictionaries.and.returnValue(of(void 0));

      store.deleteDictionary('dict1');
      tick();

      expect(store.dictionaries().length).toBe(1);
      expect(store.dictionaries().find(d => d.id === 'dict1')).toBeUndefined();
    }));

    it('should clear selection if deleted dictionary was selected', fakeAsync(() => {
      tick();
      store.selectDictionary('dict1');
      apiServiceSpy.deleteAssetDictionaries.and.returnValue(of(void 0));

      store.deleteDictionary('dict1');
      tick();

      expect(store.selectedDictionary()).toBeNull();
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.deleteAssetDictionaries.and.returnValue(throwError(() => new Error()));

      store.deleteDictionary('dict1');
      tick();

      expect(store.error()).toBe('Failed to delete asset dictionary');
    }));
  });

  describe('addNode', () => {
    it('should add node to dictionary', fakeAsync(() => {
      tick();
      const newNode: AssetNode = {
        id: 'node3',
        dictionaryId: 'dict1',
        name: 'New Node',
        icon: 'folder',
        parentId: null,
        order: 1,
        entryIds: []
      };
      apiServiceSpy.createAssetNode.and.returnValue(of(newNode));

      store.addNode({
        dictionaryId: 'dict1',
        name: 'New Node',
        icon: 'folder',
        parentId: null
      });
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      expect(dict?.nodes.find(n => n.id === 'node3')).toBeTruthy();
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.createAssetNode.and.returnValue(throwError(() => new Error()));

      store.addNode({
        dictionaryId: 'dict1',
        name: 'Test',
        icon: 'folder',
        parentId: null
      });
      tick();

      expect(store.error()).toBe('Failed to add node');
    }));
  });

  describe('updateNode', () => {
    it('should update node in dictionary', fakeAsync(() => {
      tick();
      const updated = { ...mockNodes[0], name: 'Updated Node' };
      apiServiceSpy.updateAssetNode.and.returnValue(of(updated));

      store.updateNode({
        dictionaryId: 'dict1',
        id: 'node1',
        name: 'Updated Node'
      });
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      const node = dict?.nodes.find(n => n.id === 'node1');
      expect(node?.name).toBe('Updated Node');
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.updateAssetNode.and.returnValue(throwError(() => new Error()));

      store.updateNode({
        dictionaryId: 'dict1',
        id: 'node1',
        name: 'Test'
      });
      tick();

      expect(store.error()).toBe('Failed to update node');
    }));
  });

  describe('deleteNode', () => {
    it('should remove node and descendants', fakeAsync(() => {
      tick();
      apiServiceSpy.deleteAssetNode.and.returnValue(of(void 0));

      store.deleteNode('dict1', 'node1');
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      expect(dict?.nodes.find(n => n.id === 'node1')).toBeUndefined();
      expect(dict?.nodes.find(n => n.id === 'node2')).toBeUndefined(); // Child should be removed too
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.deleteAssetNode.and.returnValue(throwError(() => new Error()));

      store.deleteNode('dict1', 'node1');
      tick();

      expect(store.error()).toBe('Failed to delete node');
    }));
  });

  describe('assignEntries', () => {
    it('should assign entries to node', fakeAsync(() => {
      tick();
      apiServiceSpy.assignEntriesToNode.and.returnValue(of(void 0));

      store.assignEntries('dict1', 'node1', ['entry4', 'entry5']);
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      const node = dict?.nodes.find(n => n.id === 'node1');
      expect(node?.entryIds).toEqual(['entry4', 'entry5']);
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.assignEntriesToNode.and.returnValue(throwError(() => new Error()));

      store.assignEntries('dict1', 'node1', ['entry4']);
      tick();

      expect(store.error()).toBe('Failed to assign entries');
    }));
  });

  describe('addEntriesToNode', () => {
    it('should add entries to existing entries (batch operation)', fakeAsync(() => {
      tick();
      apiServiceSpy.assignEntriesToNode.and.returnValue(of(void 0));

      // node1 already has ['entry1', 'entry2']
      store.addEntriesToNode('dict1', 'node1', ['entry3', 'entry4']);
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      const node = dict?.nodes.find(n => n.id === 'node1');
      // Should have merged: entry1, entry2, entry3, entry4
      expect(node?.entryIds).toContain('entry1');
      expect(node?.entryIds).toContain('entry2');
      expect(node?.entryIds).toContain('entry3');
      expect(node?.entryIds).toContain('entry4');
    }));

    it('should not duplicate existing entries', fakeAsync(() => {
      tick();
      apiServiceSpy.assignEntriesToNode.and.returnValue(of(void 0));

      // node1 already has ['entry1', 'entry2']
      store.addEntriesToNode('dict1', 'node1', ['entry1', 'entry3']); // entry1 is duplicate
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      const node = dict?.nodes.find(n => n.id === 'node1');
      const entry1Count = node?.entryIds.filter(id => id === 'entry1').length;
      expect(entry1Count).toBe(1); // No duplicates
    }));

    it('should do nothing if empty array passed', fakeAsync(() => {
      tick();
      store.addEntriesToNode('dict1', 'node1', []);
      tick();

      expect(apiServiceSpy.assignEntriesToNode).not.toHaveBeenCalled();
    }));
  });

  describe('removeEntryFromNode', () => {
    it('should remove entry from node', fakeAsync(() => {
      tick();
      apiServiceSpy.removeEntryFromNode.and.returnValue(of(void 0));

      store.removeEntryFromNode('dict1', 'node1', 'entry1');
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      const node = dict?.nodes.find(n => n.id === 'node1');
      expect(node?.entryIds).not.toContain('entry1');
    }));

    it('should set error on failure', fakeAsync(() => {
      tick();
      apiServiceSpy.removeEntryFromNode.and.returnValue(throwError(() => new Error()));

      store.removeEntryFromNode('dict1', 'node1', 'entry1');
      tick();

      expect(store.error()).toBe('Failed to remove entry from node');
    }));
  });

  describe('moveNode', () => {
    it('should move node to new parent', fakeAsync(() => {
      tick();
      apiServiceSpy.moveAssetNode.and.returnValue(of(void 0));

      store.moveNode('dict1', 'node2', null, 1); // Move child to root
      tick();

      const dict = store.dictionaries().find(d => d.id === 'dict1');
      const node = dict?.nodes.find(n => n.id === 'node2');
      expect(node?.parentId).toBeNull();
      expect(node?.order).toBe(1);
    }));

    it('should prevent circular reference', fakeAsync(() => {
      tick();
      // Try to move parent under its own child - should be prevented
      store.moveNode('dict1', 'node1', 'node2', 0);
      tick();

      expect(apiServiceSpy.moveAssetNode).not.toHaveBeenCalled();
      expect(store.error()).toBe('Cannot move node: would create circular reference');
    }));

    it('should set error on API failure', fakeAsync(() => {
      tick();
      apiServiceSpy.moveAssetNode.and.returnValue(throwError(() => new Error()));

      store.moveNode('dict1', 'node2', null, 0);
      tick();

      expect(store.error()).toBe('Failed to move node');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should unregister from polling service', () => {
      store.ngOnDestroy();

      expect(pollingServiceSpy.unregister).toHaveBeenCalledWith('asset-dictionary-store');
    });
  });
});

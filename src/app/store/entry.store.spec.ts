import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EntryStore } from './entry.store';
import { ApiService } from '../core/services';
import { CatalogEntry, DataType } from '../core/models';

describe('EntryStore', () => {
  let store: EntryStore;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockEntries: CatalogEntry[] = [
    {
      id: '1',
      name: 'Entry 1',
      dataType: DataType.Float32,
      sourceParams: { path: '/path1' },
      labels: [],
      sourceConnection: {
        id: 'sc1',
        name: 'Source 1',
        sourceType: { id: 'st1', name: 'PostgreSQL' }
      }
    },
    {
      id: '2',
      name: 'Entry 2',
      dataType: DataType.String,
      sourceParams: { path: '/path2' },
      labels: [],
      sourceConnection: {
        id: 'sc1',
        name: 'Source 1',
        sourceType: { id: 'st1', name: 'PostgreSQL' }
      }
    }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getCatalogEntries',
      'createCatalogEntries',
      'updateCatalogEntries',
      'deleteCatalogEntries'
    ]);

    TestBed.configureTestingModule({
      providers: [
        EntryStore,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    store = TestBed.inject(EntryStore);
  });

  describe('initial state', () => {
    it('should have empty entries', () => {
      expect(store.entries()).toEqual([]);
    });

    it('should have total as 0', () => {
      expect(store.total()).toBe(0);
    });

    it('should not be loading', () => {
      expect(store.loading()).toBeFalse();
    });

    it('should have no error', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('load', () => {
    it('should load entries from API', fakeAsync(() => {
      apiServiceSpy.getCatalogEntries.and.returnValue(of(mockEntries));

      store.load();
      tick();

      expect(store.entries()).toEqual(mockEntries);
      expect(store.total()).toBe(2);
      expect(store.loading()).toBeFalse();
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.getCatalogEntries.and.returnValue(throwError(() => new Error('Network error')));

      store.load();
      tick();

      expect(store.error()).toBe('Failed to load entries');
      expect(store.loading()).toBeFalse();
    }));
  });

  describe('create', () => {
    it('should add new entry to entries', fakeAsync(() => {
      const newEntry: CatalogEntry = {
        id: '3',
        name: 'New Entry',
        dataType: DataType.Int32,
        sourceParams: { path: '/path3' },
        labels: [],
        sourceConnection: {
          id: 'sc1',
          name: 'Source 1',
          sourceType: { id: 'st1', name: 'PostgreSQL' }
        }
      };

      store.setEntries(mockEntries);
      apiServiceSpy.createCatalogEntries.and.returnValue(of([newEntry]));

      store.create({
        name: 'New Entry',
        sourceConnectionId: 'sc1',
        dataType: DataType.Int32,
        sourceParams: { path: '/path3' }
      });
      tick();

      expect(store.entries().length).toBe(3);
      expect(store.entries()).toContain(newEntry);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.createCatalogEntries.and.returnValue(throwError(() => new Error()));

      store.create({
        name: 'Test',
        sourceConnectionId: 'sc1',
        dataType: DataType.String,
        sourceParams: {}
      });
      tick();

      expect(store.error()).toBe('Failed to create entry');
    }));
  });

  describe('update', () => {
    it('should update entry in entries', fakeAsync(() => {
      store.setEntries(mockEntries);
      const updatedEntry = { ...mockEntries[0], name: 'Updated Entry' };
      apiServiceSpy.updateCatalogEntries.and.returnValue(of([updatedEntry]));

      store.update({ id: '1', name: 'Updated Entry' });
      tick();

      const entry = store.entries().find(e => e.id === '1');
      expect(entry?.name).toBe('Updated Entry');
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.updateCatalogEntries.and.returnValue(throwError(() => new Error()));

      store.update({ id: '1', name: 'Test' });
      tick();

      expect(store.error()).toBe('Failed to update entry');
    }));
  });

  describe('delete', () => {
    it('should remove entries from list', fakeAsync(() => {
      store.setEntries(mockEntries);
      apiServiceSpy.deleteCatalogEntries.and.returnValue(of(void 0));

      store.delete(['1']);
      tick();

      expect(store.entries().length).toBe(1);
      expect(store.entries().find(e => e.id === '1')).toBeUndefined();
    }));

    it('should delete multiple entries', fakeAsync(() => {
      store.setEntries(mockEntries);
      apiServiceSpy.deleteCatalogEntries.and.returnValue(of(void 0));

      store.delete(['1', '2']);
      tick();

      expect(store.entries().length).toBe(0);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.deleteCatalogEntries.and.returnValue(throwError(() => new Error()));

      store.delete(['1']);
      tick();

      expect(store.error()).toBe('Failed to delete entries');
    }));
  });

  describe('setEntries', () => {
    it('should set entries directly', () => {
      store.setEntries(mockEntries);

      expect(store.entries()).toEqual(mockEntries);
      expect(store.total()).toBe(2);
    });
  });
});

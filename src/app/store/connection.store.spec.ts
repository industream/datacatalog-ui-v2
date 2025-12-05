import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ConnectionStore } from './connection.store';
import { ApiService } from '../core/services';
import { SourceConnection } from '../core/models';

describe('ConnectionStore', () => {
  let store: ConnectionStore;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockConnections: SourceConnection[] = [
    {
      id: 'sc1',
      name: 'PostgreSQL Dev',
      description: 'Development database',
      connectionConfiguration: { host: 'localhost' },
      sourceType: { id: 'st1', name: 'PostgreSQL' }
    },
    {
      id: 'sc2',
      name: 'InfluxDB Prod',
      description: 'Production metrics',
      connectionConfiguration: { host: 'metrics.example.com' },
      sourceType: { id: 'st2', name: 'InfluxDB2' }
    }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getSourceConnections',
      'createSourceConnections',
      'updateSourceConnections',
      'deleteSourceConnections'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ConnectionStore,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    store = TestBed.inject(ConnectionStore);
  });

  describe('initial state', () => {
    it('should have empty connections', () => {
      expect(store.connections()).toEqual([]);
    });

    it('should have total as 0', () => {
      expect(store.total()).toBe(0);
    });
  });

  describe('load', () => {
    it('should load connections from API', fakeAsync(() => {
      apiServiceSpy.getSourceConnections.and.returnValue(of(mockConnections));

      store.load();
      tick();

      expect(store.connections()).toEqual(mockConnections);
      expect(store.total()).toBe(2);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.getSourceConnections.and.returnValue(throwError(() => new Error()));

      store.load();
      tick();

      expect(store.error()).toBe('Failed to load source connections');
    }));
  });

  describe('create', () => {
    it('should add new connection', fakeAsync(() => {
      const newConnection: SourceConnection = {
        id: 'sc3',
        name: 'New Connection',
        description: '',
        connectionConfiguration: {},
        sourceType: { id: 'st1', name: 'PostgreSQL' }
      };

      store.setConnections(mockConnections);
      apiServiceSpy.createSourceConnections.and.returnValue(of([newConnection]));

      store.create({ name: 'New Connection', sourceTypeId: 'st1', connectionConfiguration: {} });
      tick();

      expect(store.connections().length).toBe(3);
      expect(store.connections()).toContain(newConnection);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.createSourceConnections.and.returnValue(throwError(() => new Error()));

      store.create({ name: 'Test', sourceTypeId: 'st1', connectionConfiguration: {} });
      tick();

      expect(store.error()).toBe('Failed to create source connection');
    }));
  });

  describe('update', () => {
    it('should update connection', fakeAsync(() => {
      store.setConnections(mockConnections);
      const updatedConnection = { ...mockConnections[0], name: 'Updated Connection' };
      apiServiceSpy.updateSourceConnections.and.returnValue(of([updatedConnection]));

      store.update({ id: 'sc1', name: 'Updated Connection' });
      tick();

      const connection = store.connections().find(c => c.id === 'sc1');
      expect(connection?.name).toBe('Updated Connection');
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.updateSourceConnections.and.returnValue(throwError(() => new Error()));

      store.update({ id: 'sc1', name: 'Test' });
      tick();

      expect(store.error()).toBe('Failed to update source connection');
    }));
  });

  describe('delete', () => {
    it('should remove connections', fakeAsync(() => {
      store.setConnections(mockConnections);
      apiServiceSpy.deleteSourceConnections.and.returnValue(of(void 0));

      store.delete(['sc1']);
      tick();

      expect(store.connections().length).toBe(1);
      expect(store.connections().find(c => c.id === 'sc1')).toBeUndefined();
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.deleteSourceConnections.and.returnValue(throwError(() => new Error()));

      store.delete(['sc1']);
      tick();

      expect(store.error()).toBe('Failed to delete source connections');
    }));
  });

  describe('setConnections', () => {
    it('should set connections directly', () => {
      store.setConnections(mockConnections);

      expect(store.connections()).toEqual(mockConnections);
      expect(store.total()).toBe(2);
    });
  });
});

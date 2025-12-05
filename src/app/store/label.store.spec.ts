import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LabelStore } from './label.store';
import { ApiService } from '../core/services';
import { Label } from '../core/models';

describe('LabelStore', () => {
  let store: LabelStore;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockLabels: Label[] = [
    { id: 'l1', name: 'Production' },
    { id: 'l2', name: 'Development' },
    { id: 'l3', name: 'Testing' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getLabels',
      'createLabels',
      'deleteLabels'
    ]);

    TestBed.configureTestingModule({
      providers: [
        LabelStore,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    store = TestBed.inject(LabelStore);
  });

  describe('initial state', () => {
    it('should have empty labels', () => {
      expect(store.labels()).toEqual([]);
    });

    it('should have total as 0', () => {
      expect(store.total()).toBe(0);
    });
  });

  describe('load', () => {
    it('should load labels from API', fakeAsync(() => {
      apiServiceSpy.getLabels.and.returnValue(of(mockLabels));

      store.load();
      tick();

      expect(store.labels()).toEqual(mockLabels);
      expect(store.total()).toBe(3);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.getLabels.and.returnValue(throwError(() => new Error()));

      store.load();
      tick();

      expect(store.error()).toBe('Failed to load labels');
    }));
  });

  describe('create', () => {
    it('should add new label', fakeAsync(() => {
      const newLabel: Label = { id: 'l4', name: 'Staging' };

      store.setLabels(mockLabels);
      apiServiceSpy.createLabels.and.returnValue(of([newLabel]));

      store.create({ name: 'Staging' });
      tick();

      expect(store.labels().length).toBe(4);
      expect(store.labels()).toContain(newLabel);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.createLabels.and.returnValue(throwError(() => new Error()));

      store.create({ name: 'Test' });
      tick();

      expect(store.error()).toBe('Failed to create label');
    }));
  });

  describe('delete', () => {
    it('should remove labels', fakeAsync(() => {
      store.setLabels(mockLabels);
      apiServiceSpy.deleteLabels.and.returnValue(of(void 0));

      store.delete(['l1']);
      tick();

      expect(store.labels().length).toBe(2);
      expect(store.labels().find(l => l.id === 'l1')).toBeUndefined();
    }));

    it('should delete multiple labels', fakeAsync(() => {
      store.setLabels(mockLabels);
      apiServiceSpy.deleteLabels.and.returnValue(of(void 0));

      store.delete(['l1', 'l2']);
      tick();

      expect(store.labels().length).toBe(1);
    }));

    it('should set error on failure', fakeAsync(() => {
      apiServiceSpy.deleteLabels.and.returnValue(throwError(() => new Error()));

      store.delete(['l1']);
      tick();

      expect(store.error()).toBe('Failed to delete labels');
    }));
  });

  describe('setLabels', () => {
    it('should set labels directly', () => {
      store.setLabels(mockLabels);

      expect(store.labels()).toEqual(mockLabels);
      expect(store.total()).toBe(3);
    });
  });
});

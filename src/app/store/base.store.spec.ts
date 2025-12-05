import { of, throwError } from 'rxjs';
import { BaseStore } from './base.store';

// Concrete implementation for testing
class TestStore extends BaseStore {
  public testExecuteWithLoading<T>(
    operation: any,
    onSuccess: (result: T) => void,
    errorMessage: string
  ): void {
    this.executeWithLoading(operation, onSuccess, errorMessage);
  }

  public testExecuteSilently<T>(
    operation: any,
    onSuccess: (result: T) => void
  ): void {
    this.executeSilently(operation, onSuccess);
  }
}

describe('BaseStore', () => {
  let store: TestStore;

  beforeEach(() => {
    store = new TestStore();
  });

  describe('initial state', () => {
    it('should have loading as false', () => {
      expect(store.loading()).toBeFalse();
    });

    it('should have error as null', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('executeWithLoading', () => {
    it('should set loading to true during operation', () => {
      const result = 'test-result';
      let loadingDuringExecution = false;

      store.testExecuteWithLoading(
        of(result),
        () => {
          loadingDuringExecution = store.loading();
        },
        'Test error'
      );

      // After completion, loading should be false
      expect(store.loading()).toBeFalse();
    });

    it('should call onSuccess with result on success', () => {
      const result = { data: 'test' };
      let receivedResult: any;

      store.testExecuteWithLoading(
        of(result),
        (r) => { receivedResult = r; },
        'Test error'
      );

      expect(receivedResult).toEqual(result);
    });

    it('should set error message on failure', () => {
      const errorMessage = 'Operation failed';

      store.testExecuteWithLoading(
        throwError(() => new Error('Network error')),
        () => {},
        errorMessage
      );

      expect(store.error()).toBe(errorMessage);
      expect(store.loading()).toBeFalse();
    });

    it('should clear previous error on new operation', () => {
      // First, set an error
      store.testExecuteWithLoading(
        throwError(() => new Error()),
        () => {},
        'First error'
      );
      expect(store.error()).toBe('First error');

      // Then, run a successful operation
      store.testExecuteWithLoading(
        of('success'),
        () => {},
        'Second error'
      );
      expect(store.error()).toBeNull();
    });
  });

  describe('executeSilently', () => {
    it('should not set loading state', () => {
      store.testExecuteSilently(of('result'), () => {});
      expect(store.loading()).toBeFalse();
    });

    it('should call onSuccess with result', () => {
      const result = { data: 'test' };
      let receivedResult: any;

      store.testExecuteSilently(
        of(result),
        (r) => { receivedResult = r; }
      );

      expect(receivedResult).toEqual(result);
    });

    it('should not set error on failure (silent fail)', () => {
      store.testExecuteSilently(
        throwError(() => new Error('Network error')),
        () => {}
      );

      expect(store.error()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // Set an error first
      store.testExecuteWithLoading(
        throwError(() => new Error()),
        () => {},
        'Some error'
      );
      expect(store.error()).toBe('Some error');

      // Clear it
      store.clearError();
      expect(store.error()).toBeNull();
    });
  });
});

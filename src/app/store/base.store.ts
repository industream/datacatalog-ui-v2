import { signal } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Base store class providing common state management patterns
 */
export abstract class BaseStore {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Execute an operation with loading state management
   */
  protected executeWithLoading<T>(
    operation: Observable<T>,
    onSuccess: (result: T) => void,
    errorMessage: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    operation.subscribe({
      next: (result) => {
        onSuccess(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  /**
   * Execute an operation silently (no loading indicator)
   */
  protected executeSilently<T>(
    operation: Observable<T>,
    onSuccess: (result: T) => void
  ): void {
    operation.subscribe({
      next: onSuccess,
      error: () => { /* Silent fail for polling */ }
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }
}

import { signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../core/services/toast.service';

/**
 * Base store class providing common state management patterns
 */
export abstract class BaseStore {
  protected readonly toastService = inject(ToastService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Execute an operation with loading state management
   */
  protected executeWithLoading<T>(
    operation: Observable<T>,
    onSuccess: (result: T) => void,
    errorMessage: string,
    showToast = true
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
        if (showToast) {
          this.toastService.error(errorMessage);
        }
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

import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  timestamp: number;
}

const DEFAULT_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly timeoutRegistry = new Map<string, ReturnType<typeof setTimeout>>();
  private idCounter = 0;

  readonly toasts = this._toasts.asReadonly();
  readonly hasToasts = computed(() => this._toasts().length > 0);

  show(type: ToastType, title: string, message?: string, duration = DEFAULT_DURATION): string {
    const id = `toast-${++this.idCounter}`;
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: Date.now()
    };

    this._toasts.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      const timeoutId = setTimeout(() => this.dismiss(id), duration);
      this.timeoutRegistry.set(id, timeoutId);
    }

    return id;
  }

  success(title: string, message?: string, duration?: number): string {
    return this.show('success', title, message, duration);
  }

  error(title: string, message?: string, duration?: number): string {
    return this.show('error', title, message, duration ?? 8000); // Errors stay longer
  }

  warning(title: string, message?: string, duration?: number): string {
    return this.show('warning', title, message, duration);
  }

  info(title: string, message?: string, duration?: number): string {
    return this.show('info', title, message, duration);
  }

  dismiss(id: string): void {
    // Clear timeout to prevent memory leak
    const timeoutId = this.timeoutRegistry.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutRegistry.delete(id);
    }
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    // Clear all pending timeouts
    this.timeoutRegistry.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeoutRegistry.clear();
    this._toasts.set([]);
  }
}

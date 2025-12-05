import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly _state = signal<ConfirmationState>({
    isOpen: false,
    options: null,
    resolve: null
  });

  readonly state = this._state.asReadonly();

  confirm(options: ConfirmationOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._state.set({
        isOpen: true,
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          danger: false,
          ...options
        },
        resolve
      });
    });
  }

  handleConfirm(): void {
    const state = this._state();
    if (state.resolve) {
      state.resolve(true);
    }
    this.close();
  }

  handleCancel(): void {
    const state = this._state();
    if (state.resolve) {
      state.resolve(false);
    }
    this.close();
  }

  private close(): void {
    this._state.set({
      isOpen: false,
      options: null,
      resolve: null
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="dismiss(toast.id)">
          <div class="toast-icon">
            <span class="material-symbols-outlined">{{ getIcon(toast.type) }}</span>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-message">{{ toast.message }}</div>
            }
          </div>
          <button class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: var(--dc-bg-secondary);
      border-radius: var(--dc-radius-md);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-left: 4px solid;
      cursor: pointer;
      animation: slideIn 0.2s ease-out;

      &.success {
        border-left-color: var(--dc-success);
        .toast-icon { color: var(--dc-success); }
      }

      &.error {
        border-left-color: var(--dc-error);
        .toast-icon { color: var(--dc-error); }
      }

      &.warning {
        border-left-color: var(--dc-warning);
        .toast-icon { color: var(--dc-warning); }
      }

      &.info {
        border-left-color: var(--dc-info);
        .toast-icon { color: var(--dc-info); }
      }

      &:hover {
        background: var(--dc-bg-tertiary);
      }
    }

    .toast-icon {
      flex-shrink: 0;
      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 500;
      font-size: var(--dc-text-size-sm);
      color: var(--dc-text-primary);
    }

    .toast-message {
      font-size: var(--dc-text-size-xs);
      color: var(--dc-text-secondary);
      margin-top: 4px;
      word-wrap: break-word;
    }

    .toast-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--dc-text-tertiary);
      cursor: pointer;
      border-radius: var(--dc-radius-sm);

      &:hover {
        background: var(--dc-bg-primary);
        color: var(--dc-text-primary);
      }

      .material-symbols-outlined {
        font-size: 16px;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}

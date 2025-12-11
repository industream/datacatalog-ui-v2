import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../../core/services/confirmation.service';

import '@carbon/web-components/es/components/button/index.js';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (confirmationService.state().isOpen) {
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ confirmationService.state().options?.title }}</h2>
            <button class="icon-btn" (click)="onCancel()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <p>{{ confirmationService.state().options?.message }}</p>
          </div>
          <div class="modal-footer">
            <cds-button kind="ghost" (click)="onCancel()">
              {{ confirmationService.state().options?.cancelText }}
            </cds-button>
            <cds-button
              [attr.kind]="confirmationService.state().options?.danger ? 'danger' : 'primary'"
              (click)="onConfirm()">
              {{ confirmationService.state().options?.confirmText }}
            </cds-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: var(--dc-space-xl);
    }

    .modal-content {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-lg);
      width: 100%;
      max-width: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--dc-shadow-xl);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
    }

    .modal-body {
      padding: var(--dc-space-lg);

      p {
        margin: 0;
        color: var(--dc-text-secondary);
        line-height: 1.5;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-lg);
      border-top: 1px solid var(--dc-border-subtle);
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: var(--dc-radius-sm);
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-tertiary);
        color: var(--dc-text-primary);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  readonly confirmationService = inject(ConfirmationService);

  onConfirm(): void {
    this.confirmationService.handleConfirm();
  }

  onCancel(): void {
    this.confirmationService.handleCancel();
  }
}

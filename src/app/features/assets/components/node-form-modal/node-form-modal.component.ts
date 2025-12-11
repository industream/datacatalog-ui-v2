import { Component, Input, Output, EventEmitter, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { AssetNode } from '../../../../store/asset-dictionary.store';

import '@carbon/web-components/es/components/button/index.js';

export interface NodeFormData {
  name: string;
  description?: string;
  icon: string;
}

export interface NodeSaveEvent {
  data: NodeFormData;
  editingNode: AssetNode | null;
  parentId: string | null;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

@Component({
  selector: 'app-node-form-modal',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="modal-backdrop">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h2>{{ editingNode ? 'Edit Node' : 'New Node' }}</h2>
          <button class="icon-btn" (click)="onClose()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group" [class.has-error]="touched().name && errors().name">
            <label for="node-name">Name *</label>
            <input
              type="text"
              id="node-name"
              class="form-input"
              [class.input-error]="touched().name && errors().name"
              [value]="name()"
              (input)="onNameInput($event)"
              (blur)="markTouched('name')"
              placeholder="e.g., Production Line 1"
              maxlength="100">
            @if (touched().name && errors().name) {
              <span class="error-message">{{ errors().name }}</span>
            }
            <span class="char-count">{{ name().length }}/100</span>
          </div>

          <div class="form-group" [class.has-error]="touched().description && errors().description">
            <label for="node-description">Description</label>
            <textarea
              id="node-description"
              class="form-textarea"
              [class.input-error]="touched().description && errors().description"
              [value]="description()"
              (input)="onDescriptionInput($event)"
              (blur)="markTouched('description')"
              placeholder="Optional description..."
              maxlength="500"></textarea>
            @if (touched().description && errors().description) {
              <span class="error-message">{{ errors().description }}</span>
            }
            <span class="char-count">{{ description().length }}/500</span>
          </div>

          <div class="form-group">
            <label>Icon</label>
            <div class="icon-selector">
              @for (iconOption of availableIcons; track iconOption) {
                <button
                  class="icon-option"
                  [class.selected]="icon() === iconOption"
                  (click)="icon.set(iconOption)">
                  <span class="material-symbols-outlined">{{ iconOption }}</span>
                </button>
              }
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <cds-button kind="ghost" (click)="onClose()">Cancel</cds-button>
          <cds-button kind="primary" (click)="onSave()" [disabled]="!isValid()">
            {{ editingNode ? 'Update' : 'Create' }}
          </cds-button>
        </div>
      </div>
    </div>
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
      z-index: 1000;
      padding: var(--dc-space-xl);
    }

    .modal-content {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--dc-shadow-xl);
    }

    .modal-sm {
      max-width: 400px;
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
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-lg);
      border-top: 1px solid var(--dc-border-subtle);
    }

    .form-group {
      margin-bottom: var(--dc-space-lg);
      position: relative;

      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-weight: 500;
        font-size: 0.875rem;
      }

      &.has-error label {
        color: var(--dc-error);
      }
    }

    .error-message {
      display: block;
      margin-top: var(--dc-space-xs);
      font-size: 0.75rem;
      color: var(--dc-error);
    }

    .char-count {
      display: block;
      margin-top: var(--dc-space-xs);
      font-size: 0.7rem;
      color: var(--dc-text-tertiary);
      text-align: right;
    }

    .input-error {
      border-color: var(--dc-error) !important;

      &:focus {
        border-color: var(--dc-error) !important;
        box-shadow: 0 0 0 1px var(--dc-error);
      }
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 10px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      &::placeholder {
        color: var(--dc-text-placeholder);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 60px;
    }

    .icon-selector {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dc-space-xs);
    }

    .icon-option {
      width: 36px;
      height: 36px;
      border: 1px solid var(--dc-border-subtle);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--dc-text-secondary);
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-primary);
        color: var(--dc-text-primary);
      }

      &.selected {
        border-color: var(--dc-primary);
        background: var(--dc-primary);
        color: white;
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
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
export class NodeFormModalComponent {
  @Input() editingNode: AssetNode | null = null;
  @Input() parentId: string | null = null;

  @Input() set initialName(value: string) {
    this.name.set(value);
  }

  @Input() set initialDescription(value: string) {
    this.description.set(value);
  }

  @Input() set initialIcon(value: string) {
    this.icon.set(value);
  }

  @Output() save = new EventEmitter<NodeSaveEvent>();
  @Output() close = new EventEmitter<void>();

  readonly name = signal('');
  readonly description = signal('');
  readonly icon = signal('folder');
  readonly touched = signal<{ name: boolean; description: boolean }>({ name: false, description: false });

  readonly availableIcons = [
    'folder', 'factory', 'precision_manufacturing', 'settings',
    'bolt', 'memory', 'developer_board', 'dns', 'storage',
    'air', 'electrical_services', 'water_drop', 'thermostat',
    'sensors', 'speed', 'monitor_heart', 'analytics'
  ];

  readonly errors = computed((): ValidationErrors => {
    const errs: ValidationErrors = {};
    const nameValue = this.name().trim();
    const descValue = this.description();

    if (!nameValue) {
      errs.name = 'Name is required';
    } else if (nameValue.length < 2) {
      errs.name = 'Name must be at least 2 characters';
    } else if (nameValue.length > 100) {
      errs.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_()]+$/.test(nameValue)) {
      errs.name = 'Name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses';
    }

    if (descValue && descValue.length > 500) {
      errs.description = 'Description must be less than 500 characters';
    }

    return errs;
  });

  readonly isValid = computed(() => {
    const errs = this.errors();
    return !errs.name && !errs.description;
  });

  markTouched(field: 'name' | 'description'): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.name.set(input.value);
  }

  onDescriptionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.description.set(textarea.value);
  }

  onSave(): void {
    // Mark all fields as touched to show errors
    this.touched.set({ name: true, description: true });

    if (!this.isValid()) return;

    this.save.emit({
      data: {
        name: this.name().trim(),
        description: this.description().trim() || undefined,
        icon: this.icon()
      },
      editingNode: this.editingNode,
      parentId: this.parentId
    });
  }

  onClose(): void {
    this.close.emit();
  }
}

import { Component, Input, Output, EventEmitter, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetNode } from '../../../../core/models';

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

@Component({
  selector: 'app-node-form-modal',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingNode ? 'Edit Node' : 'New Node' }}</h2>
          <button class="icon-btn" (click)="onClose()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="node-name">Name *</label>
            <input
              type="text"
              id="node-name"
              class="form-input"
              [value]="name()"
              (input)="onNameInput($event)"
              placeholder="e.g., Production Line 1">
          </div>

          <div class="form-group">
            <label for="node-description">Description</label>
            <textarea
              id="node-description"
              class="form-textarea"
              [value]="description()"
              (input)="onDescriptionInput($event)"
              placeholder="Optional description..."></textarea>
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
          <cds-button kind="primary" (click)="onSave()" [disabled]="!name()">
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

      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-weight: 500;
        font-size: 0.875rem;
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

  readonly availableIcons = [
    'folder', 'factory', 'precision_manufacturing', 'settings',
    'bolt', 'memory', 'developer_board', 'dns', 'storage',
    'air', 'electrical_services', 'water_drop', 'thermostat',
    'sensors', 'speed', 'monitor_heart', 'analytics'
  ];

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.name.set(input.value);
  }

  onDescriptionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.description.set(textarea.value);
  }

  onSave(): void {
    if (!this.name()) return;

    this.save.emit({
      data: {
        name: this.name(),
        description: this.description() || undefined,
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

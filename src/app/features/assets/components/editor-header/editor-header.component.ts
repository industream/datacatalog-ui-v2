import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetDictionary } from '../../../../core/models';

import '@carbon/web-components/es/components/button/index.js';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="editor-header">
      <div class="header-left">
        <button class="back-btn" (click)="backClick.emit()">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        @if (dictionary) {
          <div class="header-info">
            <div class="dict-icon" [style.background]="dictionary.color || 'var(--dc-primary)'">
              <span class="material-symbols-outlined">{{ dictionary.icon || 'account_tree' }}</span>
            </div>
            <div class="header-text">
              <h1>{{ dictionary.name }}</h1>
              <p class="subtitle">{{ dictionary.description || 'Asset hierarchy editor' }}</p>
            </div>
          </div>
        }
      </div>
      <div class="header-actions">
        <cds-button kind="tertiary" (click)="addRootNode.emit()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          Add Root Node
        </cds-button>
      </div>
    </header>
  `,
  styles: [`
    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--dc-space-md) var(--dc-space-lg);
      background: var(--dc-bg-secondary);
      border-bottom: 1px solid var(--dc-border-subtle);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: var(--dc-radius-md);
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-tertiary);
        color: var(--dc-text-primary);
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
    }

    .dict-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--dc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      .material-symbols-outlined {
        font-size: 24px;
        color: white;
      }
    }

    .header-text {
      h1 {
        margin: 0;
        font-size: var(--dc-text-size-xl);
        font-weight: 600;
        color: var(--dc-text-primary);
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: var(--dc-text-size-sm);
        color: var(--dc-text-secondary);
      }
    }

    .header-actions {
      display: flex;
      gap: var(--dc-space-sm);
    }
  `]
})
export class EditorHeaderComponent {
  @Input() dictionary: AssetDictionary | null = null;
  @Output() backClick = new EventEmitter<void>();
  @Output() addRootNode = new EventEmitter<void>();
}

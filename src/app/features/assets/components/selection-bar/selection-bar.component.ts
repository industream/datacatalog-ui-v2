import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selection-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="selection-bar" [@slideDown]>
      <div class="selection-info">
        <span class="material-symbols-outlined">check_circle</span>
        {{ count }} selected
      </div>
      <div class="selection-actions">
        @if (showAssignButton) {
          <button class="selection-btn" (click)="assign.emit()">
            <span class="material-symbols-outlined">add</span>
            Assign to node
          </button>
        }
        <button class="selection-btn danger" (click)="clear.emit()">
          <span class="material-symbols-outlined">close</span>
          Clear
        </button>
      </div>
    </div>
  `,
  styles: [`
    .selection-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--dc-space-sm) var(--dc-space-md);
      background: var(--dc-primary);
      color: white;
      border-radius: var(--dc-radius-sm);
      margin-bottom: var(--dc-space-sm);
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .selection-info {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      font-size: var(--dc-text-size-sm);
      font-weight: 500;
    }

    .selection-actions {
      display: flex;
      gap: var(--dc-space-xs);
    }

    .selection-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: var(--dc-radius-sm);
      font-size: 12px;
      cursor: pointer;
      transition: background var(--dc-duration-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      &.danger:hover {
        background: var(--dc-error);
      }

      .material-symbols-outlined {
        font-size: 16px;
      }
    }
  `]
})
export class SelectionBarComponent {
  @Input() count = 0;
  @Input() showAssignButton = false;

  @Output() assign = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
}

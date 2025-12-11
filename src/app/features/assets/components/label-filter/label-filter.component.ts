import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Label } from '@industream/datacatalog-client/dto';
import { LabelColorService } from '../../../../core/services';

@Component({
  selector: 'app-label-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="label-filter-bar">
      <span class="filter-label">Filter by label:</span>
      <div class="label-chips">
        <button
          class="label-chip"
          [class.active]="selectedLabelId === null"
          (click)="onSelectLabel(null)">
          All
        </button>
        @for (label of labels; track label.id) {
          <button
            class="label-chip"
            [class.active]="selectedLabelId === label.id"
            [style.--label-color]="getLabelColor(label)"
            (click)="onSelectLabel(label.id)">
            <span class="label-dot"></span>
            {{ label.name }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .label-filter-bar {
      display: flex;
      align-items: center;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-sm) var(--dc-space-lg);
      background: var(--dc-bg-secondary);
      border-bottom: 1px solid var(--dc-border-subtle);
      flex-shrink: 0;
      overflow-x: auto;
    }

    .filter-label {
      font-size: var(--dc-text-size-sm);
      color: var(--dc-text-secondary);
      white-space: nowrap;
    }

    .label-chips {
      display: flex;
      gap: var(--dc-space-xs);
      flex-wrap: nowrap;
    }

    .label-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: 1px solid var(--dc-border-subtle);
      background: var(--dc-bg-tertiary);
      color: var(--dc-text-secondary);
      border-radius: var(--dc-radius-full);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-primary);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--dc-primary);
        border-color: var(--dc-primary);
        color: white;

        .label-dot {
          background: white;
        }
      }
    }

    .label-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--label-color, var(--dc-text-secondary));
    }
  `]
})
export class LabelFilterComponent {
  private readonly labelColorService = inject(LabelColorService);

  @Input() labels: Label[] = [];
  @Input() selectedLabelId: string | null = null;

  @Output() labelSelect = new EventEmitter<string | null>();

  getLabelColor(label: Label): string {
    return this.labelColorService.getColor(label);
  }

  onSelectLabel(labelId: string | null): void {
    this.labelSelect.emit(labelId);
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'card' | 'avatar' | 'button' | 'table-row' | 'list-item';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('text') {
        <div class="skeleton skeleton-text" [style.width]="width" [style.height]="height || '16px'"></div>
      }
      @case ('card') {
        <div class="skeleton skeleton-card" [style.width]="width" [style.height]="height || '120px'"></div>
      }
      @case ('avatar') {
        <div class="skeleton skeleton-avatar" [style.width]="width || '40px'" [style.height]="height || '40px'"></div>
      }
      @case ('button') {
        <div class="skeleton skeleton-button" [style.width]="width || '80px'" [style.height]="height || '32px'"></div>
      }
      @case ('table-row') {
        <div class="skeleton-table-row">
          @for (col of columns; track $index) {
            <div class="skeleton skeleton-text" [style.width]="col"></div>
          }
        </div>
      }
      @case ('list-item') {
        <div class="skeleton-list-item">
          <div class="skeleton skeleton-avatar" style="width: 32px; height: 32px;"></div>
          <div class="skeleton-content">
            <div class="skeleton skeleton-text" style="width: 60%;"></div>
            <div class="skeleton skeleton-text" style="width: 40%; height: 12px;"></div>
          </div>
        </div>
      }
      @default {
        <div class="skeleton" [style.width]="width" [style.height]="height"></div>
      }
    }
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--dc-bg-tertiary) 25%,
        var(--dc-bg-secondary) 50%,
        var(--dc-bg-tertiary) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--dc-radius-sm);
    }

    .skeleton-text {
      height: 16px;
      width: 100%;
    }

    .skeleton-card {
      width: 100%;
      height: 120px;
      border-radius: var(--dc-radius-md);
    }

    .skeleton-avatar {
      border-radius: 50%;
    }

    .skeleton-button {
      border-radius: var(--dc-radius-sm);
    }

    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--dc-border-subtle);
    }

    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      margin-bottom: 4px;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() columns: string[] = ['20%', '30%', '25%', '25%'];
}

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    @for (item of items; track $index) {
      <app-skeleton [type]="type" [width]="width" [height]="height" [columns]="columns"></app-skeleton>
    }
  `
})
export class SkeletonListComponent {
  @Input() count = 3;
  @Input() type: SkeletonType = 'list-item';
  @Input() width?: string;
  @Input() height?: string;
  @Input() columns: string[] = ['20%', '30%', '25%', '25%'];

  get items(): number[] {
    return Array(this.count).fill(0);
  }
}

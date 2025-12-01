import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

@Component({
  selector: 'app-explorer',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="explorer-container">
      <header class="explorer-header">
        <h1>Explorer</h1>
        <p class="subtitle">Browse and manage your catalog entries</p>
      </header>

      <div class="toolbar">
        <div class="search-section">
          <cds-search
            size="lg"
            placeholder="Search entries..."
            (cds-search-input)="onSearch($event)">
          </cds-search>
        </div>

        <div class="view-toggle">
          @for (view of viewModes; track view.id) {
            <button
              class="view-btn"
              [class.active]="currentView() === view.id"
              (click)="setView(view.id)"
              [title]="view.label">
              <span class="material-symbols-outlined">{{ view.icon }}</span>
            </button>
          }
        </div>

        <div class="actions">
          <cds-button kind="primary">
            <span class="material-symbols-outlined" slot="icon">add</span>
            New Entry
          </cds-button>
        </div>
      </div>

      <div class="content-area">
        <div class="placeholder">
          <span class="material-symbols-outlined placeholder-icon">folder_open</span>
          <h2>Explorer View</h2>
          <p>This is where catalog entries will be displayed in {{ currentView() }} mode.</p>
          <p class="coming-soon">Full implementation coming in Phase 3</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .explorer-container {
      padding: var(--dc-space-xl);
      max-width: 1600px;
      margin: 0 auto;
    }

    .explorer-header {
      margin-bottom: var(--dc-space-lg);

      h1 {
        margin: 0 0 var(--dc-space-xs);
        font-size: 2rem;
        font-weight: 600;
      }

      .subtitle {
        margin: 0;
        color: var(--dc-text-secondary);
      }
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--dc-space-lg);
      margin-bottom: var(--dc-space-lg);
      padding: var(--dc-space-md);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
    }

    .search-section {
      flex: 1;
      max-width: 400px;
    }

    .view-toggle {
      display: flex;
      gap: 2px;
      background: var(--dc-bg-tertiary);
      padding: 2px;
      border-radius: var(--dc-radius-sm);
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: var(--dc-text-secondary);
      cursor: pointer;
      border-radius: var(--dc-radius-sm);
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-secondary);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--dc-primary);
        color: white;
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .content-area {
      min-height: 400px;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-2xl);
      text-align: center;
      background: var(--dc-bg-secondary);
      border: 2px dashed var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);

      .placeholder-icon {
        font-size: 64px;
        color: var(--dc-text-secondary);
        margin-bottom: var(--dc-space-lg);
      }

      h2 {
        margin: 0 0 var(--dc-space-sm);
        color: var(--dc-text-primary);
      }

      p {
        margin: 0;
        color: var(--dc-text-secondary);
      }

      .coming-soon {
        margin-top: var(--dc-space-md);
        font-style: italic;
        opacity: 0.7;
      }
    }
  `]
})
export class ExplorerComponent {
  readonly viewModes = [
    { id: 'list', label: 'List View', icon: 'view_list' },
    { id: 'grid', label: 'Grid View', icon: 'grid_view' },
    { id: 'table', label: 'Table View', icon: 'table_rows' },
    { id: 'graph', label: 'Graph View', icon: 'hub' }
  ];

  readonly currentView = signal<string>('grid');

  setView(viewId: string): void {
    this.currentView.set(viewId);
  }

  onSearch(event: Event): void {
    const customEvent = event as CustomEvent;
    console.log('Search:', customEvent.detail?.value);
  }
}

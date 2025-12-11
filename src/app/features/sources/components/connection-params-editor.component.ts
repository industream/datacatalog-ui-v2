import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connection-params-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="params-editor">
      <div class="params-header">
        <h4>Connection Parameters</h4>
        <button
          type="button"
          class="add-param-btn"
          (click)="addParameter()"
          (mousedown)="onMouseDown($event)">
          <span class="material-symbols-outlined">add</span>
          Add Parameter
        </button>
      </div>

      @if (parameters().length === 0) {
        <p class="empty-hint">No parameters defined. Click "Add Parameter" to add one.</p>
      } @else {
        <div class="params-list">
          @for (param of parameters(); track param.id) {
            <div class="param-row">
              <input
                type="text"
                class="param-input param-key"
                [value]="param.key"
                (input)="updateKey(param.id, $event)"
                placeholder="Key">
              <input
                type="text"
                class="param-input param-value"
                [value]="param.value"
                (input)="updateValue(param.id, $event)"
                placeholder="Value">
              <button type="button" class="icon-btn danger" (click)="removeParameter(param.id)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .params-editor {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-md);
    }

    .params-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--dc-text-primary);
      }
    }

    .add-param-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-hover);
        border-color: var(--dc-border-strong);
      }

      .material-symbols-outlined {
        font-size: 16px;
      }
    }

    .empty-hint {
      padding: var(--dc-space-lg);
      text-align: center;
      color: var(--dc-text-secondary);
      font-size: 0.875rem;
      background: var(--dc-bg-tertiary);
      border: 1px dashed var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      margin: 0;
    }

    .params-list {
      display: flex;
      flex-direction: column;
      gap: var(--dc-space-sm);
    }

    .param-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: var(--dc-space-sm);
      align-items: center;
    }

    .param-input {
      padding: 8px 12px;
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--dc-primary);
      }

      &.param-key {
        font-family: monospace;
      }
    }

    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
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

      &.danger:hover {
        background: color-mix(in srgb, var(--dc-error) 15%, transparent);
        color: var(--dc-error);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }
  `]
})
export class ConnectionParamsEditorComponent {
  @Input()
  set initialParams(params: Record<string, unknown>) {
    console.log('[ConnectionParamsEditor] initialParams setter called with:', params);
    // Only set if parameters is empty to avoid overwriting user changes
    if (this.parameters().length === 0) {
      const paramList = Object.entries(params || {}).map(([key, value]) => ({
        id: this.nextId++,
        key,
        value: String(value)
      }));
      console.log('[ConnectionParamsEditor] Setting initial params:', paramList);
      this.parameters.set(paramList);
    }
  }

  @Output() paramsChange = new EventEmitter<Record<string, string>>();

  private nextId = 1;
  readonly parameters = signal<Array<{ id: number; key: string; value: string }>>([]);

  onMouseDown(event: MouseEvent): void {
    console.log('[ConnectionParamsEditor] mousedown event captured', event);
    event.stopPropagation();
  }

  addParameter(): void {
    console.log('[ConnectionParamsEditor] addParameter called');
    console.log('[ConnectionParamsEditor] Current params:', this.parameters());
    this.parameters.update(params => {
      const newParams = [
        ...params,
        { id: this.nextId++, key: '', value: '' }
      ];
      console.log('[ConnectionParamsEditor] New params:', newParams);
      return newParams;
    });
  }

  removeParameter(id: number): void {
    this.parameters.update(params => params.filter(p => p.id !== id));
    this.emitChanges();
  }

  updateKey(id: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.parameters.update(params =>
      params.map(p => p.id === id ? { ...p, key: value } : p)
    );
    this.emitChanges();
  }

  updateValue(id: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.parameters.update(params =>
      params.map(p => p.id === id ? { ...p, value } : p)
    );
    this.emitChanges();
  }

  private emitChanges(): void {
    const params = this.parameters()
      .filter(p => p.key.trim() !== '')
      .reduce((acc, p) => {
        acc[p.key] = p.value;
        return acc;
      }, {} as Record<string, string>);
    this.paramsChange.emit(params);
  }
}

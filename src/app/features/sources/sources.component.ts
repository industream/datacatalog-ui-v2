import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, computed } from '@angular/core';

import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/modal/index.js';
import '@carbon/web-components/es/components/text-input/index.js';
import '@carbon/web-components/es/components/dropdown/index.js';

import { CatalogStore } from '../../store';
import type { SourceConnection, SourceType } from '@industream/datacatalog-client/dto';
import { ConnectionParamsEditorComponent } from './components/connection-params-editor.component';
import { SOURCE_TYPE_IDS } from '../../core/constants/source-types';

type ViewMode = 'table' | 'grid' | 'list';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [ConnectionParamsEditorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="sources-container">
      <header class="sources-header">
        <div class="header-content">
          <h1>Source Connections</h1>
          <p class="subtitle">Manage your data source connections</p>
        </div>
        <cds-button kind="primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          New Connection
        </cds-button>
      </header>

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading connections...</p>
        </div>
      } @else if (store.sourceConnections().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">cable</span>
          <h2>No source connections</h2>
          <p>Create your first source connection to start importing data</p>
          <cds-button kind="primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined" slot="icon">add</span>
            Create Connection
          </cds-button>
        </div>
      } @else {
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="filters">
            <input
              type="text"
              class="filter-input"
              placeholder="Filter by name..."
              [value]="nameFilter()"
              (input)="onNameFilterChange($event)">

            <div class="type-filters">
              <button
                class="type-filter-btn"
                [class.active]="selectedType() === null"
                (click)="filterByType(null)">
                All ({{ store.sourceConnections().length }})
              </button>
              @for (type of sourceTypesWithCount(); track type.id) {
                <button
                  class="type-filter-btn"
                  [class.active]="selectedType() === type.name"
                  [style.--type-color]="getSourceColor(type.name)"
                  (click)="filterByType(type.name)">
                  {{ type.name }} ({{ type.count }})
                </button>
              }
            </div>
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
        </div>

        <!-- View Content -->
        <div class="content-area" [class]="currentView()">
          @switch (currentView()) {
            @case ('table') {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th class="checkbox-col">
                        <input
                          type="checkbox"
                          [checked]="allSelected()"
                          [indeterminate]="someSelected()"
                          (change)="toggleSelectAll()">
                      </th>
                      <th class="name-col">Name</th>
                      <th class="type-col">Source Type</th>
                      <th class="params-col">Connection Properties</th>
                      <th class="entries-col">Entries</th>
                      <th class="actions-col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (connection of filteredConnections(); track connection.id) {
                      <tr [class.selected]="selectedIds().has(connection.id)">
                        <td class="checkbox-col">
                          <input
                            type="checkbox"
                            [checked]="selectedIds().has(connection.id)"
                            (change)="toggleSelect(connection.id)">
                        </td>
                        <td class="name-col">
                          <span class="connection-name">{{ connection.name }}</span>
                        </td>
                        <td class="type-col">
                          <span class="source-type-badge" [style.background]="getSourceColor(connection.sourceType.name)">
                            {{ connection.sourceType.name || 'Unknown' }}
                          </span>
                        </td>
                        <td class="params-col">
                          <span class="json-preview" [title]="formatJson(connection)">
                            {{ getObjectPreview(connection) }}
                          </span>
                        </td>
                        <td class="entries-col">
                          <span class="entry-count">{{ getEntryCount(connection.id) }}</span>
                        </td>
                        <td class="actions-col">
                          <button class="icon-btn" title="Edit" (click)="onEditConnection(connection)">
                            <span class="material-symbols-outlined">edit</span>
                          </button>
                          <button class="icon-btn danger" title="Delete" (click)="onDeleteConnection(connection)">
                            <span class="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            @case ('grid') {
              <div class="connections-grid">
                @for (connection of filteredConnections(); track connection.id) {
                  <div class="connection-card" [class.selected]="selectedIds().has(connection.id)">
                    <div class="card-header">
                      <div class="card-checkbox">
                        <input
                          type="checkbox"
                          [checked]="selectedIds().has(connection.id)"
                          (change)="toggleSelect(connection.id); $event.stopPropagation()"
                          (click)="$event.stopPropagation()">
                      </div>
                      <span class="source-type-badge" [style.background]="getSourceColor(connection.sourceType.name)">
                        {{ connection.sourceType.name || 'Unknown' }}
                      </span>
                    </div>
                    <h3 class="card-title">{{ connection.name }}</h3>

                    <div class="card-info">
                      <span class="entry-count-badge">
                        {{ getEntryCount(connection.id) }} entries
                      </span>
                    </div>

                    <!-- Connection Properties -->
                    @if (getObjectKeys(connection).length > 2) {
                      <div class="card-section">
                        <h5>Properties</h5>
                        <div class="card-details">
                          @for (key of getObjectKeys(connection); track key) {
                            @if (key !== 'id' && key !== 'sourceType') {
                              <div class="detail-item">
                                <span class="detail-key">{{ key }}:</span>
                                <span class="detail-value">{{ formatObjectValue(connection[key]) }}</span>
                              </div>
                            }
                          }
                        </div>
                      </div>
                    }

                    <div class="card-actions">
                      <button class="icon-btn" title="Edit" (click)="onEditConnection(connection); $event.stopPropagation()">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button class="icon-btn danger" title="Delete" (click)="onDeleteConnection(connection); $event.stopPropagation()">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
            @case ('list') {
              <div class="list-view">
                @for (connection of filteredConnections(); track connection.id) {
                  <div class="list-item-wrapper" [class.selected]="selectedIds().has(connection.id)">
                    <div class="list-item">
                      <div class="list-item-checkbox">
                        <input
                          type="checkbox"
                          [checked]="selectedIds().has(connection.id)"
                          (change)="toggleSelect(connection.id); $event.stopPropagation()"
                          (click)="$event.stopPropagation()">
                      </div>
                      <div class="list-item-main">
                        <span class="connection-name">{{ connection.name }}</span>
                        @if (getObjectKeys(connection).length > 2) {
                          <div class="data-badge small" [title]="formatJson(connection)">
                            {{ getObjectKeys(connection).length - 2 }} properties
                          </div>
                        }
                      </div>
                      <div class="list-item-meta">
                        <span class="source-type-badge" [style.background]="getSourceColor(connection.sourceType.name)">
                          {{ connection.sourceType.name }}
                        </span>
                        <span class="entry-count">{{ getEntryCount(connection.id) }} entries</span>
                        <div class="list-item-actions">
                          <button class="icon-btn" title="Edit" (click)="onEditConnection(connection)">
                            <span class="material-symbols-outlined">edit</span>
                          </button>
                          <button class="icon-btn danger" title="Delete" (click)="onDeleteConnection(connection)">
                            <span class="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      }

      <!-- Bulk Actions Bar -->
      @if (selectedIds().size > 0) {
        <div class="bulk-actions-bar">
          <span class="selection-count">{{ selectedIds().size }} selected</span>
          <cds-button kind="danger" size="sm" (click)="onBulkDelete()">
            <span class="material-symbols-outlined" slot="icon">delete</span>
            Delete Selected
          </cds-button>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h2>{{ editingConnection() ? 'Edit Connection' : 'New Connection' }}</h2>
              <button type="button" class="icon-btn" (click)="closeModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="conn-name">Name</label>
                <input
                  type="text"
                  id="conn-name"
                  class="form-input"
                  [value]="formData()['name']"
                  (input)="updateFormField('name', $event)">
              </div>
              <div class="form-group">
                <label for="conn-type">Source Type</label>
                <select
                  id="conn-type"
                  class="form-select"
                  (change)="updateFormField('sourceTypeId', $event)"
                  [disabled]="!!editingConnection()">
                  <option value="">Select a type...</option>
                  @for (type of store.sourceTypes(); track type.id) {
                    <option [value]="type.id" [selected]="type.id === formData()['sourceTypeId']">{{ type.name }}</option>
                  }
                </select>
              </div>

              <!-- Dynamic fields based on source type -->
              @if (selectedSourceType()) {
                @if (isDataBridgeType()) {
                  <div class="form-group">
                    <label for="url">URL</label>
                    <input type="text" id="url" class="form-input" [value]="formData()['url'] || ''" (input)="updateFormField('url', $event)" placeholder="https://...">
                  </div>
                } @else {
                  <app-connection-params-editor
                    [initialParams]="connectionParams()"
                    (paramsChange)="onParamsChange($event)">
                  </app-connection-params-editor>
                }
              }
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="saveConnection()">
                {{ editingConnection() ? 'Update' : 'Create' }}
              </cds-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sources-container {
      padding: calc(var(--dc-card-padding) * 2);
      max-width: 1400px;
      margin: 0 auto;
    }

    .sources-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--dc-header-gap);

      .header-content {
        h1 {
          margin: 0 0 var(--dc-space-xs);
          font-weight: 600;
        }

        .subtitle {
          margin: 0;
          color: var(--dc-text-secondary);
          font-size: var(--dc-text-size-base);
        }
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dc-space-2xl);
      text-align: center;
      background: var(--dc-bg-secondary);
      border: 2px dashed var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      min-height: 400px;

      .material-symbols-outlined {
        font-size: 64px;
        color: var(--dc-text-secondary);
        margin-bottom: var(--dc-space-lg);
      }

      h2 {
        margin: 0 0 var(--dc-space-sm);
      }

      p {
        margin: 0 0 var(--dc-space-lg);
        color: var(--dc-text-secondary);
      }
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--dc-space-md);
      margin-bottom: var(--dc-header-gap);
      padding: var(--dc-space-md);
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      flex-wrap: wrap;
    }

    .filters {
      display: flex;
      gap: var(--dc-space-sm);
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }

    .filter-input {
      flex: 1;
      min-width: 150px;
      max-width: 200px;
      padding: var(--dc-input-padding);
      background: var(--dc-bg-tertiary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-sm);
      color: var(--dc-text-primary);
      font-size: var(--dc-text-size-sm);

      &:focus {
        outline: 2px solid var(--dc-primary);
        outline-offset: 2px;
      }

      &::placeholder {
        color: var(--dc-text-placeholder);
      }
    }

    .type-filters {
      display: flex;
      gap: var(--dc-space-xs);
      flex-wrap: wrap;
    }

    .type-filter-btn {
      padding: var(--dc-button-padding);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-full);
      background: var(--dc-bg-secondary);
      color: var(--dc-text-secondary);
      font-size: var(--dc-text-size-sm);
      cursor: pointer;
      transition: all var(--dc-duration-fast);
      white-space: nowrap;

      &:hover {
        border-color: var(--dc-border-strong);
        color: var(--dc-text-primary);
      }

      &.active {
        background: var(--type-color, var(--dc-primary));
        border-color: var(--type-color, var(--dc-primary));
        color: white;
      }
    }

    /* View Toggle */
    .view-toggle {
      display: flex;
      gap: calc(var(--dc-space-unit) / 2);
      padding: calc(var(--dc-space-unit) / 2);
      background: var(--dc-bg-primary);
      border-radius: var(--dc-radius-sm);
    }

    .view-btn {
      display: inline-flex;
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

    .connections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--dc-grid-gap);
    }

    .connection-card {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      padding: var(--dc-card-padding);
      cursor: pointer;
      transition: all var(--dc-duration-fast);

      &:hover {
        border-color: var(--dc-primary);
        box-shadow: var(--dc-shadow-md);
        transform: translateY(-2px);
      }

      &.selected {
        background: var(--dc-bg-selected);
        border-color: var(--dc-primary);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--dc-header-gap);
      }

      .card-checkbox {
        display: flex;
        align-items: center;

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
      }

      .card-title {
        margin: 0 0 var(--dc-space-xs);
        font-size: var(--dc-text-size-lg);
        font-weight: 600;
        color: var(--dc-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-info {
        margin-bottom: var(--dc-header-gap);
      }

      .entry-count-badge {
        display: inline-block;
        padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
        background: var(--dc-bg-tertiary);
        border-radius: var(--dc-radius-full);
        font-size: var(--dc-text-size-sm);
        color: var(--dc-text-secondary);
      }

      .card-details {
        display: flex;
        flex-direction: column;
        gap: var(--dc-space-xs);
      }

      .card-actions {
        display: flex;
        gap: calc(var(--dc-space-unit) / 2);
        margin-top: var(--dc-header-gap);
        padding-top: var(--dc-header-gap);
        border-top: 1px solid var(--dc-border-subtle);
      }
    }

    .source-type-badge {
      display: inline-block;
      padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
      border-radius: var(--dc-radius-sm);
      font-size: var(--dc-text-size-sm);
      font-weight: 500;
      color: white;
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

    /* Table View */
    .table-container {
      background: var(--dc-bg-secondary);
      border: 1px solid var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: var(--dc-bg-tertiary);
        border-bottom: 2px solid var(--dc-border);
      }

      th, td {
        padding: var(--dc-table-cell-padding);
        text-align: left;
      }

      th {
        font-weight: 600;
        font-size: var(--dc-text-size-sm);
        color: var(--dc-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      tbody tr {
        border-bottom: 1px solid var(--dc-border-subtle);
        transition: background var(--dc-duration-fast);

        &:hover {
          background: var(--dc-bg-tertiary);
        }

        &.selected {
          background: var(--dc-bg-selected);
        }

        &:last-child {
          border-bottom: none;
        }
      }

      .checkbox-col {
        width: 40px;

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
      }

      .name-col {
        width: 25%;
      }

      .type-col {
        width: 20%;
      }

      .params-col {
        width: 30%;
      }

      .entries-col {
        width: 15%;
        text-align: center;
      }

      .actions-col {
        width: 10%;
        text-align: right;

        .icon-btn {
          margin-left: calc(var(--dc-space-unit) / 2);
        }
      }

      .connection-name {
        font-weight: 500;
        color: var(--dc-text-primary);
      }

      .json-preview {
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--dc-text-secondary);
        cursor: help;
      }
    }

    /* List View */
    .list-view {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: var(--dc-border-subtle);
      border-radius: var(--dc-radius-md);
      overflow: hidden;
    }

    .list-item-wrapper {
      background: var(--dc-bg-secondary);

      &.selected {
        background: var(--dc-bg-selected);
      }
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-table-cell-padding);
      background: transparent;
      transition: background var(--dc-duration-fast);

      &:hover {
        background: var(--dc-bg-tertiary);
      }

      .list-item-checkbox {
        display: flex;
        align-items: center;
        margin-right: var(--dc-space-xs);

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
      }

      .list-item-main {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
        flex: 1;
        min-width: 0;
      }

      .connection-name {
        font-weight: 500;
        color: var(--dc-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-item-meta {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
        flex-shrink: 0;
      }

      .list-item-actions {
        display: flex;
        gap: calc(var(--dc-space-unit) / 2);
        margin-left: var(--dc-space-sm);
      }
    }

    .data-badge {
      display: inline-flex;
      align-items: center;
      padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
      background: var(--dc-bg-tertiary);
      border-radius: var(--dc-radius-sm);
      font-size: var(--dc-text-size-sm);
      color: var(--dc-text-secondary);
      white-space: nowrap;

      &.small {
        font-size: var(--dc-text-size-xs);
        padding: calc(var(--dc-space-unit) / 3) calc(var(--dc-space-unit) * 0.75);
      }
    }

    /* Grid View - Additional styles */
    .card-section {
      margin-bottom: var(--dc-header-gap);

      h5 {
        margin: 0 0 var(--dc-space-xs);
        font-size: var(--dc-text-size-sm);
        font-weight: 600;
        color: var(--dc-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .detail-item {
      display: flex;
      gap: var(--dc-space-xs);
      font-size: var(--dc-text-size-sm);

      .detail-key {
        color: var(--dc-text-secondary);
        min-width: 80px;
      }

      .detail-value {
        color: var(--dc-text-primary);
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--dc-bg-secondary);
      border-radius: var(--dc-radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--dc-space-lg);
      border-bottom: 1px solid var(--dc-border-subtle);

      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .modal-body {
      padding: var(--dc-space-lg);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--dc-space-sm);
      padding: var(--dc-space-lg);
      border-top: 1px solid var(--dc-border-subtle);
    }

    .form-group {
      margin-bottom: var(--dc-space-md);

      label {
        display: block;
        margin-bottom: var(--dc-space-xs);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--dc-text-secondary);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dc-space-md);
    }

    .form-input,
    .form-select {
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

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .info-text {
      color: var(--dc-text-secondary);
      font-size: 0.875rem;
      font-style: italic;
    }

    .field-hint {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--dc-text-secondary);
      font-style: italic;
    }

    /* Bulk Actions Bar */
    .bulk-actions-bar {
      position: fixed;
      bottom: var(--dc-space-lg);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--dc-space-md);
      padding: var(--dc-space-md);
      background: var(--dc-bg-primary);
      border: 1px solid var(--dc-border);
      border-radius: var(--dc-radius-md);
      box-shadow: var(--dc-shadow-lg);
      z-index: 100;

      .selection-count {
        font-weight: 500;
        color: var(--dc-text-primary);
      }
    }
  `]
})
export class SourcesComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly nameFilter = signal('');
  readonly selectedType = signal<string | null>(null);
  readonly currentView = signal<ViewMode>('table');
  readonly showModal = signal(false);
  readonly editingConnection = signal<SourceConnection | null>(null);
  readonly formData = signal<Record<string, unknown>>({ name: '', sourceTypeId: '' });
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly viewModes = [
    { id: 'table' as const, label: 'Table View', icon: 'table_rows' },
    { id: 'grid' as const, label: 'Grid View', icon: 'grid_view' },
    { id: 'list' as const, label: 'List View', icon: 'view_list' }
  ];

  private readonly sourceTypeColors: Record<string, string> = {
    'DataBridge': 'var(--dc-source-databridge)',
    'PostgreSQL': 'var(--dc-source-postgresql)',
    'InfluxDB2': 'var(--dc-source-influxdb)',
    'MQTT': 'var(--dc-source-mqtt)',
    'S3': 'var(--dc-source-s3)',
    'Email': 'var(--dc-source-email)',
    'Http': 'var(--dc-source-http)',
    'OPC-UA': 'var(--dc-source-opcua)',
    'Modbus-TCP': 'var(--dc-source-modbus)',
    'Leneda': 'var(--dc-source-leneda)'
  };

  readonly sourceTypesWithCount = computed(() => {
    const connections = this.store.sourceConnections();
    const counts = new Map<string, number>();

    connections.forEach(conn => {
      const typeName = conn.sourceType?.name;
      if (typeName) {
        counts.set(typeName, (counts.get(typeName) || 0) + 1);
      }
    });

    return this.store.sourceTypes()
      .filter(type => counts.has(type.name))
      .map(type => ({
        ...type,
        count: counts.get(type.name) || 0
      }));
  });

  readonly filteredConnections = computed(() => {
    let connections = this.store.sourceConnections();
    const name = this.nameFilter().toLowerCase();
    const type = this.selectedType();

    if (name) {
      connections = connections.filter(c => c.name.toLowerCase().includes(name));
    }

    if (type) {
      connections = connections.filter(c => c.sourceType?.name === type);
    }

    return connections;
  });

  readonly selectedSourceType = computed(() => {
    const typeId = this.formData()['sourceTypeId'] as string;
    return this.store.sourceTypes().find(t => t.id === typeId) || null;
  });

  readonly allSelected = computed(() => {
    const connections = this.filteredConnections();
    return connections.length > 0 && connections.every(c => this.selectedIds().has(c.id));
  });

  readonly someSelected = computed(() => {
    const selected = this.selectedIds();
    const connections = this.filteredConnections();
    return connections.some(c => selected.has(c.id)) && !this.allSelected();
  });

  readonly connectionParams = computed(() => {
    const data = this.formData();
    const { name, sourceTypeId, ...params } = data;
    return params;
  });

  ngOnInit(): void {
    if (this.store.sourceConnections().length === 0) {
      this.store.loadAll();
    }
  }

  isDataBridgeType(): boolean {
    const selectedType = this.selectedSourceType();
    return selectedType?.id === SOURCE_TYPE_IDS.DATABRIDGE;
  }

  getConnectionParams(): Record<string, unknown> {
    const data = this.formData();
    const { name, sourceTypeId, ...params } = data;
    return params;
  }

  onParamsChange(params: Record<string, string>): void {
    // Clean formData: remove all keys except name and sourceTypeId, then add the new params
    this.formData.update(data => {
      const { name, sourceTypeId } = data;
      return {
        name,
        sourceTypeId,
        ...params
      };
    });
  }

  getSourceColor(type: string | undefined): string {
    return this.sourceTypeColors[type || ''] || 'var(--dc-border-strong)';
  }

  getEntryCount(connectionId: string): number {
    return this.store.entries().filter(e => e.sourceConnection?.id === connectionId).length;
  }

  filterByType(type: string | null): void {
    this.selectedType.set(type);
  }

  onNameFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.nameFilter.set(input.value);
  }

  setView(view: ViewMode): void {
    this.currentView.set(view);
  }

  getObjectKeys(obj: Record<string, unknown> | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatObjectValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  getObjectPreview(obj: Record<string, unknown> | undefined): string {
    if (!obj) return '-';
    const keys = Object.keys(obj);
    if (keys.length === 0) return '-';
    if (keys.length === 1) return `${keys[0]}: ${this.formatObjectValue(obj[keys[0]])}`;
    return `${keys.length} properties`;
  }

  formatJson(obj: Record<string, unknown> | undefined): string {
    return obj ? JSON.stringify(obj, null, 2) : '{}';
  }

  openCreateModal(): void {
    this.editingConnection.set(null);
    this.formData.set({ name: '', sourceTypeId: '' });
    this.showModal.set(true);
  }

  onEditConnection(connection: SourceConnection): void {
    this.editingConnection.set(connection);
    const { id, name, sourceType, ...rest } = connection;
    this.formData.set({
      name,
      sourceTypeId: sourceType?.id || '',
      ...rest
    });
    this.showModal.set(true);
  }

  onDeleteConnection(connection: SourceConnection): void {
    const entryCount = this.getEntryCount(connection.id);
    if (entryCount > 0) {
      alert(`Cannot delete "${connection.name}". It has ${entryCount} catalog entries.`);
      return;
    }
    if (confirm(`Delete "${connection.name}"?`)) {
      this.store.deleteSourceConnections([connection.id]);
    }
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(ids => {
      const newSet = new Set(ids);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const allIds = this.filteredConnections().map(c => c.id);
      this.selectedIds.set(new Set(allIds));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  onBulkDelete(): void {
    const count = this.selectedIds().size;
    const connections = this.store.sourceConnections().filter(c => this.selectedIds().has(c.id));

    // Check if any selected connections have entries
    const connectionsWithEntries = connections.filter(c => this.getEntryCount(c.id) > 0);
    if (connectionsWithEntries.length > 0) {
      const names = connectionsWithEntries.map(c => c.name).join(', ');
      alert(`Cannot delete connections with entries: ${names}`);
      return;
    }

    if (confirm(`Delete ${count} source connections?`)) {
      this.store.deleteSourceConnections(Array.from(this.selectedIds()));
      this.clearSelection();
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingConnection.set(null);
  }

  updateFormField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
  }

  saveConnection(): void {
    const data = this.formData();
    const editing = this.editingConnection();

    if (!data['name'] || !data['sourceTypeId']) {
      alert('Please fill in required fields');
      return;
    }

    const { name, sourceTypeId, ...rest } = data;

    if (editing) {
      this.store.updateSourceConnection({
        id: editing.id,
        name: name as string,
        sourceTypeId: sourceTypeId as string,
        ...rest
      });
    } else {
      this.store.createSourceConnection({
        name: name as string,
        sourceTypeId: sourceTypeId as string,
        ...rest
      });
    }

    this.closeModal();
  }
}

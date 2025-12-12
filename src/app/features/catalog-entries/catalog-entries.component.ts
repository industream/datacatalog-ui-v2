import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
  inject,
  OnInit,
  computed,
  viewChild,
} from '@angular/core';

import '@carbon/web-components/es/components/search/index.js';
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/data-table/index.js';
import '@carbon/web-components/es/components/tag/index.js';
import '@carbon/web-components/es/components/checkbox/index.js';
import '@carbon/web-components/es/components/overflow-menu/index.js';

import { CatalogStore } from '../../store';
import type { CatalogEntry } from '@industream/datacatalog-client/dto';
import { DataType } from '@industream/datacatalog-client/dto';
import { getLabelColor } from '../labels/labels.component';
import { CatalogEntryEditorComponent } from './catalog-entry-editor.component';

type ViewMode = 'table' | 'grid' | 'list';
type SortField = 'name' | 'dataType' | 'sourceConnection' | 'labels';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-catalog-entries',
  standalone: true,
  imports: [CatalogEntryEditorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="catalog-entries-container">
      <header class="catalog-entries-header">
        <div class="header-content">
          <h1>Catalog Entries</h1>
          <p class="subtitle">Browse and manage your catalog entries</p>
        </div>
        <cds-button kind="primary" (click)="onNewEntry()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          New Entry
        </cds-button>
      </header>

      <div class="toolbar">
        <div class="search-section">
          <cds-search
            size="lg"
            placeholder="Search by entry name..."
            [value]="searchQuery()"
            (cds-search-input)="onSearch($event)"
          >
          </cds-search>
        </div>

        <div class="filters">
          <input
            type="text"
            class="filter-input"
            placeholder="Filter by source connection..."
            [value]="sourceConnectionFilter()"
            (input)="onSourceConnectionFilterChange($event)"
          />

          <select class="filter-select" (change)="onSourceTypeFilter($event)">
            <option value="">All Source Types</option>
            @for (type of store.sourceTypes(); track type.id) {
            <option [value]="type.name">{{ type.name }}</option>
            }
          </select>

          <select class="filter-select" (change)="onLabelFilter($event)">
            <option value="">All Labels</option>
            @for (label of store.labels(); track label.id) {
            <option [value]="label.id">{{ label.name }}</option>
            }
          </select>
        </div>

        <div class="view-toggle">
          @for (view of viewModes; track view.id) {
          <button
            class="view-btn"
            [class.active]="currentView() === view.id"
            (click)="setView(view.id)"
            [title]="view.label"
          >
            <span class="material-symbols-outlined">{{ view.icon }}</span>
          </button>
          }
        </div>
      </div>

      @if (store.loading()) {
      <div class="loading-state">
        <span class="material-symbols-outlined animate-pulse">sync</span>
        <p>Loading entries...</p>
      </div>
      } @else if (filteredEntries().length === 0) {
      <div class="empty-state">
        <span class="material-symbols-outlined">folder_open</span>
        <h2>No entries found</h2>
        <p>
          {{
            searchQuery()
              ? 'Try adjusting your search criteria'
              : 'Create your first catalog entry to get started'
          }}
        </p>
        @if (!searchQuery()) {
        <cds-button kind="primary" (click)="onNewEntry()">
          <span class="material-symbols-outlined" slot="icon">add</span>
          Create Entry
        </cds-button>
        }
      </div>
      } @else {
      <div class="content-area" [class]="currentView()">
        @switch (currentView()) { @case ('table') {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleSelectAll()"
                  />
                </th>
                <th class="name-col sortable" (click)="toggleSort('name')">
                  <span>Name</span>
                  <span
                    class="sort-icon material-symbols-outlined"
                    [class.active]="sortField() === 'name'"
                  >
                    {{
                      sortField() === 'name'
                        ? sortDirection() === 'asc'
                          ? 'arrow_upward'
                          : 'arrow_downward'
                        : 'unfold_more'
                    }}
                  </span>
                </th>
                <th class="type-col sortable" (click)="toggleSort('dataType')">
                  <span>Data Type</span>
                  <span
                    class="sort-icon material-symbols-outlined"
                    [class.active]="sortField() === 'dataType'"
                  >
                    {{
                      sortField() === 'dataType'
                        ? sortDirection() === 'asc'
                          ? 'arrow_upward'
                          : 'arrow_downward'
                        : 'unfold_more'
                    }}
                  </span>
                </th>
                <th class="source-col sortable" (click)="toggleSort('sourceConnection')">
                  <span>Source Connection</span>
                  <span
                    class="sort-icon material-symbols-outlined"
                    [class.active]="sortField() === 'sourceConnection'"
                  >
                    {{
                      sortField() === 'sourceConnection'
                        ? sortDirection() === 'asc'
                          ? 'arrow_upward'
                          : 'arrow_downward'
                        : 'unfold_more'
                    }}
                  </span>
                </th>
                <th class="params-col">Source Params</th>
                <th class="metadata-col">Metadata</th>
                <th class="labels-col">Labels</th>
                <th class="actions-col"></th>
              </tr>
            </thead>
            <tbody>
              @for (entry of filteredEntries(); track entry.id) {
              <tr
                [class.selected]="selectedIds().has(entry.id)"
                [class.expanded]="expandedIds().has(entry.id)"
              >
                <td class="checkbox-col">
                  <input
                    type="checkbox"
                    [checked]="selectedIds().has(entry.id)"
                    (change)="toggleSelect(entry.id)"
                  />
                </td>
                <td class="name-col">
                  <div class="name-cell">
                    <button
                      class="expand-btn"
                      (click)="toggleExpand(entry.id); $event.stopPropagation()"
                    >
                      <span class="material-symbols-outlined">
                        {{ expandedIds().has(entry.id) ? 'expand_less' : 'expand_more' }}
                      </span>
                    </button>
                    <span class="entry-name">{{ entry.name }}</span>
                  </div>
                </td>
                <td class="type-col">
                  <span class="data-type-badge">{{ entry.dataType }}</span>
                </td>
                <td class="source-col">
                  <div class="source-info">
                    <span
                      class="source-type-badge"
                      [style.background]="getSourceColor(entry.sourceConnection.sourceType.name)"
                    >
                      {{ entry.sourceConnection.sourceType.name || 'Unknown' }}
                    </span>
                    <span class="source-name">{{ entry.sourceConnection.name }}</span>
                  </div>
                </td>
                <td class="params-col">
                  <span class="json-preview" [title]="formatJson(entry.sourceParams)">
                    {{ getObjectPreview(entry.sourceParams) }}
                  </span>
                </td>
                <td class="metadata-col">
                  <span class="json-preview" [title]="formatJson(entry.metadata)">
                    {{ getObjectPreview(entry.metadata) }}
                  </span>
                </td>
                <td class="labels-col">
                  <div class="labels-list">
                    @for (label of entry.labels || []; track label.id) {
                    <span class="label-tag" [style.background]="getLabelColor(label.name)">{{
                      label.name
                    }}</span>
                    } @if (!entry.labels || entry.labels.length === 0) {
                    <span class="no-labels">-</span>
                    }
                  </div>
                </td>
                <td class="actions-col">
                  <button class="icon-btn" title="Edit" (click)="onEditEntry(entry)">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="icon-btn danger" title="Delete" (click)="onDeleteEntry(entry)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
              @if (expandedIds().has(entry.id)) {
              <tr class="expand-row">
                <td colspan="8">
                  <div class="expand-content">
                    <div class="expand-section">
                      <h4>Source Params</h4>
                      <div class="json-details">
                        @if (getObjectKeys(entry.sourceParams).length > 0) { @for (key of
                        getObjectKeys(entry.sourceParams); track key) {
                        <div class="json-item">
                          <span class="json-key">{{ key }}:</span>
                          <span class="json-value">{{
                            formatObjectValue(entry.sourceParams[key])
                          }}</span>
                        </div>
                        } } @else {
                        <span class="no-data">No source params</span>
                        }
                      </div>
                    </div>
                    <div class="expand-section">
                      <h4>Metadata</h4>
                      <div class="json-details">
                        @if (getObjectKeys(entry.metadata).length > 0) { @for (key of
                        getObjectKeys(entry.metadata); track key) {
                        <div class="json-item">
                          <span class="json-key">{{ key }}:</span>
                          <span class="json-value">{{
                            formatObjectValue(entry.metadata![key])
                          }}</span>
                        </div>
                        } } @else {
                        <span class="no-data">No metadata</span>
                        }
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              } }
            </tbody>
          </table>
        </div>
        } @case ('grid') {
        <div class="grid-view">
          @for (entry of filteredEntries(); track entry.id) {
          <div class="entry-card" [class.selected]="selectedIds().has(entry.id)">
            <div class="card-header">
              <div class="card-checkbox">
                <input
                  type="checkbox"
                  [checked]="selectedIds().has(entry.id)"
                  (change)="toggleSelect(entry.id); $event.stopPropagation()"
                  (click)="$event.stopPropagation()"
                />
              </div>
              <span
                class="source-type-badge"
                [style.background]="getSourceColor(entry.sourceConnection.sourceType.name)"
              >
                {{ entry.sourceConnection.sourceType.name || 'Unknown' }}
              </span>
              <span class="data-type-badge">{{ entry.dataType }}</span>
            </div>
            <h3 class="card-title">{{ entry.name }}</h3>
            <p class="card-source">{{ entry.sourceConnection.name }}</p>

            <div class="card-labels">
              @for (label of (entry.labels || []).slice(0, 3); track label.id) {
              <span class="label-tag" [style.background]="getLabelColor(label.name)">{{
                label.name
              }}</span>
              } @if ((entry.labels?.length || 0) > 3) {
              <span class="more-labels">+{{ (entry.labels?.length || 0) - 3 }}</span>
              }
            </div>

            <!-- Source Params - always visible -->
            @if (getObjectKeys(entry.sourceParams).length > 0) {
            <div class="card-section">
              <h5>Source Params</h5>
              <div class="card-details">
                @for (key of getObjectKeys(entry.sourceParams); track key) {
                <div class="detail-item">
                  <span class="detail-key">{{ key }}:</span>
                  <span class="detail-value">{{ formatObjectValue(entry.sourceParams[key]) }}</span>
                </div>
                }
              </div>
            </div>
            }

            <!-- Metadata - always visible -->
            @if (getObjectKeys(entry.metadata).length > 0) {
            <div class="card-section">
              <h5>Metadata</h5>
              <div class="card-details">
                @for (key of getObjectKeys(entry.metadata); track key) {
                <div class="detail-item">
                  <span class="detail-key">{{ key }}:</span>
                  <span class="detail-value">{{ formatObjectValue(entry.metadata![key]) }}</span>
                </div>
                }
              </div>
            </div>
            }

            <div class="card-actions">
              <button
                class="icon-btn"
                title="Edit"
                (click)="onEditEntry(entry); $event.stopPropagation()"
              >
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button
                class="icon-btn danger"
                title="Delete"
                (click)="onDeleteEntry(entry); $event.stopPropagation()"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
          }
        </div>
        } @case ('list') {
        <div class="list-view">
          @for (entry of filteredEntries(); track entry.id) {
          <div
            class="list-item-wrapper"
            [class.expanded]="expandedIds().has(entry.id)"
            [class.selected]="selectedIds().has(entry.id)"
          >
            <div class="list-item">
              <div class="list-item-checkbox">
                <input
                  type="checkbox"
                  [checked]="selectedIds().has(entry.id)"
                  (change)="toggleSelect(entry.id); $event.stopPropagation()"
                  (click)="$event.stopPropagation()"
                />
              </div>
              <button class="expand-btn" (click)="toggleExpand(entry.id); $event.stopPropagation()">
                <span class="material-symbols-outlined">
                  {{ expandedIds().has(entry.id) ? 'expand_less' : 'expand_more' }}
                </span>
              </button>
              <div class="list-item-main">
                <span class="entry-name">{{ entry.name }}</span>
                <span class="data-type-badge">{{ entry.dataType }}</span>
                @if (getObjectKeys(entry.sourceParams).length > 0) {
                <div class="data-badge small" [title]="formatJson(entry.sourceParams)">
                  {{ getObjectKeys(entry.sourceParams).length }} params
                </div>
                } @if (getObjectKeys(entry.metadata).length > 0) {
                <div class="data-badge small" [title]="formatJson(entry.metadata)">
                  {{ getObjectKeys(entry.metadata).length }} meta
                </div>
                }
              </div>
              <div class="list-item-meta">
                <span
                  class="source-type-badge"
                  [style.background]="getSourceColor(entry.sourceConnection.sourceType.name)"
                >
                  {{ entry.sourceConnection.sourceType.name }}
                </span>
                <span class="source-name">{{ entry.sourceConnection.name }}</span>
                <div class="list-item-actions">
                  <button
                    class="icon-btn"
                    title="Edit"
                    (click)="onEditEntry(entry); $event.stopPropagation()"
                  >
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    class="icon-btn danger"
                    title="Delete"
                    (click)="onDeleteEntry(entry); $event.stopPropagation()"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
            @if (expandedIds().has(entry.id)) {
            <div class="list-item-expanded">
              <div class="expand-content">
                <div class="expand-section">
                  <h4>Source Params</h4>
                  <div class="json-details">
                    @if (getObjectKeys(entry.sourceParams).length > 0) { @for (key of
                    getObjectKeys(entry.sourceParams); track key) {
                    <div class="json-item">
                      <span class="json-key">{{ key }}:</span>
                      <span class="json-value">{{
                        formatObjectValue(entry.sourceParams[key])
                      }}</span>
                    </div>
                    } } @else {
                    <span class="no-data">No source params</span>
                    }
                  </div>
                </div>
                <div class="expand-section">
                  <h4>Metadata</h4>
                  <div class="json-details">
                    @if (getObjectKeys(entry.metadata).length > 0) { @for (key of
                    getObjectKeys(entry.metadata); track key) {
                    <div class="json-item">
                      <span class="json-key">{{ key }}:</span>
                      <span class="json-value">{{ formatObjectValue(entry.metadata![key]) }}</span>
                    </div>
                    } } @else {
                    <span class="no-data">No metadata</span>
                    }
                  </div>
                </div>
                <div class="expand-section">
                  <h4>Labels</h4>
                  <div class="labels-list">
                    @for (label of entry.labels || []; track label.id) {
                    <span class="label-tag" [style.background]="getLabelColor(label.name)">{{
                      label.name
                    }}</span>
                    } @if (!entry.labels || entry.labels.length === 0) {
                    <span class="no-data">No labels</span>
                    }
                  </div>
                </div>
              </div>
            </div>
            }
          </div>
          }
        </div>
        } }
      </div>

      <!-- Bulk Actions Bar -->
      @if (selectedIds().size > 0) {
      <div class="bulk-actions-bar">
        <span class="selection-count">{{ selectedIds().size }} selected</span>
        <cds-button kind="danger" size="sm" (click)="onBulkDelete()">
          <span class="material-symbols-outlined" slot="icon">delete</span>
          Delete Selected
        </cds-button>
        <cds-button kind="ghost" size="sm" (click)="clearSelection()"> Cancel </cds-button>
      </div>
      }

      <!-- Pagination -->
      <div class="pagination">
        <span class="count"
          >Showing {{ filteredEntries().length }} of {{ store.entries().length }} entries</span
        >
      </div>
      }

      <!-- Entry Edit/Create Modal -->
      <app-catalog-entry-editor />
    </div>
  `,
  styles: [
    `
      .catalog-entries-container {
        padding: calc(var(--dc-card-padding) * 2);
        max-width: 1600px;
        margin: 0 auto;
      }

      .catalog-entries-header {
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

      .toolbar {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
        margin-bottom: var(--dc-header-gap);
        padding: var(--dc-card-padding);
        background: var(--dc-bg-secondary);
        border: 1px solid var(--dc-border-subtle);
        border-radius: var(--dc-radius-md);
        flex-wrap: nowrap;
        overflow-x: auto;
      }

      .search-section {
        flex: 1;
        min-width: 120px;
        max-width: 250px;

        cds-search {
          --cds-field-01: var(--dc-bg-tertiary);
          --cds-field-02: var(--dc-bg-tertiary);
          --cds-text-01: var(--dc-text-primary);
          --cds-text-02: var(--dc-text-primary);
          --cds-text-05: var(--dc-text-placeholder);
          --cds-text-placeholder: var(--dc-text-placeholder);
          --cds-icon-01: var(--dc-text-secondary);
          --cds-icon-02: var(--dc-text-secondary);
          --cds-border-subtle-01: var(--dc-border-subtle);
          --cds-focus: var(--dc-primary);

          &::part(input) {
            color: var(--dc-text-primary);
            background: var(--dc-bg-tertiary);
          }

          &::part(input)::placeholder {
            color: var(--dc-text-placeholder);
          }

          input {
            color: var(--dc-text-primary) !important;
            background: var(--dc-bg-tertiary) !important;

            &::placeholder {
              color: var(--dc-text-placeholder) !important;
              opacity: 1;
            }
          }
        }
      }

      .filters {
        display: flex;
        gap: var(--dc-space-sm);
        flex-wrap: wrap;
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

      .filter-select {
        padding: var(--dc-input-padding);
        background: var(--dc-bg-tertiary);
        border: 1px solid var(--dc-border-subtle);
        border-radius: var(--dc-radius-sm);
        color: var(--dc-text-primary);
        font-size: var(--dc-text-size-sm);
        cursor: pointer;
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:focus {
          outline: 2px solid var(--dc-primary);
          outline-offset: 2px;
        }
      }

      .view-toggle {
        display: flex;
        gap: 1px;
        background: var(--dc-bg-tertiary);
        padding: 2px;
        border-radius: var(--dc-radius-sm);
        flex-shrink: 0;
      }

      .view-btn {
        display: flex;
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
          background: var(--dc-bg-secondary);
          color: var(--dc-text-primary);
        }

        &.active {
          background: var(--dc-primary);
          color: white;
        }

        .material-symbols-outlined {
          font-size: 18px;
        }
      }

      .actions {
        flex-shrink: 0;
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

        th,
        td {
          padding: var(--dc-table-cell-padding);
          text-align: left;
          border-bottom: 1px solid var(--dc-border-subtle);
          vertical-align: middle;
        }

        th {
          background: var(--dc-bg-tertiary);
          font-weight: 600;
          font-size: var(--dc-text-size-base);
          color: var(--dc-text-secondary);

          &.sortable {
            cursor: pointer;
            user-select: none;

            &:hover {
              color: var(--dc-text-primary);
              background: var(--dc-bg-secondary);
            }

            > span:first-child {
              margin-right: 4px;
            }

            .sort-icon {
              font-size: 16px;
              opacity: 0.4;
              transition: opacity var(--dc-duration-fast);
              vertical-align: middle;

              &.active {
                opacity: 1;
                color: var(--dc-primary);
              }
            }

            &:hover .sort-icon {
              opacity: 0.8;
            }
          }
        }

        tr:hover {
          background: var(--dc-bg-tertiary);
        }

        tr.selected {
          background: color-mix(in srgb, var(--dc-primary) 10%, transparent);
        }
      }

      .checkbox-col {
        input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          color: red;
        }
      }

      .name-col {
        min-width: 200px;
      }

      .entry-name {
        font-weight: 500;
        color: var(--dc-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 250px;
        display: inline-block;
      }

      .type-col {
        width: 120px;
        white-space: nowrap;
      }

      .data-type-badge {
        display: inline-block;
        padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
        background: var(--dc-bg-tertiary);
        border-radius: var(--dc-radius-sm);
        font-size: var(--dc-text-size-sm);
        font-family: monospace;
        color: var(--dc-text-secondary);
      }

      .source-col {
        min-width: 200px;
      }

      .source-info {
        display: flex;
        align-items: center;
        gap: var(--dc-space-sm);
      }

      .source-type-badge {
        display: inline-block;
        padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
        border-radius: var(--dc-radius-sm);
        font-size: var(--dc-text-size-sm);
        font-weight: 500;
        color: white;
      }

      .source-name {
        color: var(--dc-text-secondary);
        font-size: var(--dc-text-size-base);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 150px;
      }

      .params-col,
      .metadata-col {
        min-width: 120px;
        max-width: 180px;
      }

      .json-preview {
        display: inline-block;
        padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
        background: var(--dc-bg-tertiary);
        border-radius: var(--dc-radius-sm);
        font-size: var(--dc-text-size-sm);
        font-family: monospace;
        color: var(--dc-text-secondary);
        cursor: help;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .labels-col {
        min-width: 120px;
      }

      .labels-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .label-tag {
        display: inline-block;
        padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
        background: var(--dc-primary);
        border-radius: var(--dc-radius-full);
        font-size: var(--dc-text-size-sm);
        color: white;
      }

      .no-labels,
      .no-data {
        color: var(--dc-text-placeholder);
        font-size: var(--dc-text-size-sm);
      }

      /* Expand button and row */
      .name-cell {
        display: flex;
        align-items: center;
        gap: var(--dc-space-xs);
      }

      .expand-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border: none;
        background: transparent;
        color: var(--dc-text-placeholder);
        cursor: pointer;
        border-radius: 2px;
        transition: all var(--dc-duration-fast);
        flex-shrink: 0;
        padding: 0;

        &:hover {
          color: var(--dc-text-primary);
        }

        .material-symbols-outlined {
          font-size: 16px;
        }
      }

      tr.expanded {
        background: color-mix(in srgb, var(--dc-primary) 5%, transparent);
      }

      .expand-row {
        background: var(--dc-bg-tertiary);

        td {
          padding: 0;
        }
      }

      .expand-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--dc-space-lg);
        padding: var(--dc-space-lg);
        border-top: 1px solid var(--dc-border-subtle);
      }

      .expand-section {
        h4 {
          margin: 0 0 var(--dc-space-sm);
          font-size: var(--dc-text-size-sm);
          font-weight: 600;
          color: var(--dc-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .json-details {
        background: var(--dc-bg-secondary);
        border: 1px solid var(--dc-border-subtle);
        border-radius: var(--dc-radius-sm);
        padding: var(--dc-space-sm);
      }

      .json-item {
        display: flex;
        gap: var(--dc-space-sm);
        padding: var(--dc-space-xs) 0;
        border-bottom: 1px solid var(--dc-border-subtle);
        font-size: var(--dc-text-size-sm);

        &:last-child {
          border-bottom: none;
        }
      }

      .json-key {
        font-weight: 500;
        color: var(--dc-primary);
        font-family: monospace;
        flex-shrink: 0;
      }

      .json-value {
        color: var(--dc-text-primary);
        font-family: monospace;
        word-break: break-all;
      }

      .actions-col {
        width: 60px;
        white-space: nowrap;
      }

      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border: none;
        background: transparent;
        color: var(--dc-text-secondary);
        cursor: pointer;
        border-radius: var(--dc-radius-sm);
        transition: all var(--dc-duration-fast);
        vertical-align: middle;

        &:hover {
          background: var(--dc-bg-tertiary);
          color: var(--dc-text-primary);
        }

        &.danger:hover {
          background: color-mix(in srgb, var(--dc-error) 15%, transparent);
          color: var(--dc-error);
        }

        .material-symbols-outlined {
          font-size: 16px;
        }
      }

      /* Grid View */
      .grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--dc-grid-gap);
      }

      .entry-card {
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

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--dc-header-gap);
          gap: var(--dc-space-sm);
        }

        .card-checkbox {
          display: flex;
          align-items: center;

          input[type='checkbox'] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--dc-primary);
          }
        }

        &.selected {
          border-color: var(--dc-primary);
          background: rgba(33, 150, 243, 0.05);
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

        .card-source {
          margin: 0 0 var(--dc-header-gap);
          font-size: var(--dc-text-size-base);
          color: var(--dc-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-labels {
          display: flex;
          flex-wrap: wrap;
          gap: calc(var(--dc-space-unit) / 2);
        }

        .more-labels {
          padding: calc(var(--dc-space-unit) / 2) var(--dc-space-unit);
          background: var(--dc-bg-tertiary);
          border-radius: var(--dc-radius-full);
          font-size: var(--dc-text-size-sm);
          color: var(--dc-text-secondary);
        }
      }

      /* Grid View - expand styles */
      .card-data-preview {
        display: flex;
        gap: var(--dc-space-xs);
        margin-bottom: var(--dc-space-sm);
        flex-wrap: wrap;
      }

      .data-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background: var(--dc-bg-tertiary);
        border-radius: var(--dc-radius-sm);
        font-size: var(--dc-text-size-sm);
        color: var(--dc-text-secondary);
        cursor: help;

        .material-symbols-outlined {
          font-size: 14px;
        }

        &.small {
          padding: 1px 4px;
          font-size: 11px;

          .material-symbols-outlined {
            font-size: 12px;
          }
        }
      }

      .card-expanded {
        margin-top: var(--dc-space-md);
        padding-top: var(--dc-space-md);
        border-top: 1px solid var(--dc-border-subtle);
      }

      .card-section {
        margin-top: var(--dc-space-md);
        padding-top: var(--dc-space-sm);
        border-top: 1px solid var(--dc-border-subtle);

        h5 {
          margin: 0 0 var(--dc-space-xs);
          font-size: 10px;
          font-weight: 600;
          color: var(--dc-text-placeholder);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .card-details {
        background: var(--dc-bg-tertiary);
        border-radius: var(--dc-radius-sm);
        padding: var(--dc-space-sm);
      }

      .detail-item {
        display: flex;
        gap: var(--dc-space-sm);
        padding: 4px 0;
        font-size: 12px;
        line-height: 1.4;

        &:not(:last-child) {
          border-bottom: 1px solid var(--dc-border-subtle);
          padding-bottom: 6px;
          margin-bottom: 4px;
        }
      }

      .detail-key {
        font-weight: 600;
        color: var(--dc-text-primary);
        font-family: monospace;
        flex-shrink: 0;
        min-width: 70px;
      }

      .detail-value {
        color: var(--dc-text-secondary);
        font-family: monospace;
        word-break: break-all;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--dc-space-xs);
        margin-top: var(--dc-space-md);
        padding-top: var(--dc-space-sm);
        border-top: 1px solid var(--dc-border-subtle);
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

        &.expanded {
          background: color-mix(in srgb, var(--dc-primary) 5%, var(--dc-bg-secondary));
        }

        &.selected {
          background: rgba(33, 150, 243, 0.08);
          border-left: 3px solid var(--dc-primary);
        }
      }

      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--dc-table-cell-padding);
        background: transparent;
        cursor: pointer;
        transition: background var(--dc-duration-fast);

        &:hover {
          background: var(--dc-bg-tertiary);
        }

        .list-item-checkbox {
          display: flex;
          align-items: center;
          margin-right: var(--dc-space-xs);

          input[type='checkbox'] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--dc-primary);
          }
        }

        .list-item-main {
          display: flex;
          align-items: center;
          gap: var(--dc-space-sm);
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .list-item-meta {
          display: flex;
          align-items: center;
          gap: var(--dc-space-sm);
          flex-shrink: 0;
        }
      }

      .list-item-actions {
        display: flex;
        gap: var(--dc-space-xs);
        margin-left: var(--dc-space-sm);
      }

      .list-item-expanded {
        padding: 0 var(--dc-table-cell-padding) var(--dc-table-cell-padding);
        padding-left: calc(var(--dc-table-cell-padding) + 26px);
      }

      /* Bulk Actions Bar */
      .bulk-actions-bar {
        position: fixed;
        bottom: var(--dc-space-xl);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: var(--dc-space-md);
        padding: var(--dc-space-md) var(--dc-space-lg);
        background: var(--dc-bg-tertiary);
        border: 1px solid var(--dc-border-strong);
        border-radius: var(--dc-radius-md);
        box-shadow: var(--dc-shadow-lg);

        .selection-count {
          font-weight: 500;
          color: var(--dc-text-primary);
        }
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        padding: var(--dc-space-lg);
        color: var(--dc-text-secondary);
        font-size: 0.875rem;
      }

      /* Modal styles */
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
        max-width: 600px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: var(--dc-shadow-xl);
      }

      .modal-lg {
        max-width: 700px;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--dc-space-lg);
        border-bottom: 1px solid var(--dc-border-subtle);

        h2 {
          margin: 0;
          font-size: 1.25rem;
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

      .form-row {
        display: flex;
        gap: var(--dc-space-lg);
        margin-bottom: var(--dc-space-lg);

        .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .flex-2 {
          flex: 2;
        }
      }

      .form-group {
        margin-bottom: var(--dc-space-lg);

        label {
          display: block;
          margin-bottom: var(--dc-space-xs);
          font-weight: 500;
          color: var(--dc-text-primary);
          font-size: 0.875rem;
        }
      }

      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: 10px 12px;
        background: var(--dc-bg-tertiary);
        border: 1px solid var(--dc-border-subtle);
        border-radius: var(--dc-radius-sm);
        color: var(--dc-text-primary);
        font-size: 0.875rem;
        transition: border-color var(--dc-duration-fast);

        &:focus {
          outline: none;
          border-color: var(--dc-primary);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--dc-primary) 20%, transparent);
        }

        &::placeholder {
          color: var(--dc-text-placeholder);
        }
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .labels-selector {
        display: flex;
        flex-wrap: wrap;
        gap: var(--dc-space-sm);
        padding: var(--dc-space-md);
        background: var(--dc-bg-tertiary);
        border: 1px solid var(--dc-border-subtle);
        border-radius: var(--dc-radius-sm);
        min-height: 60px;
      }

      .label-checkbox {
        display: flex;
        align-items: center;
        gap: var(--dc-space-xs);
        cursor: pointer;

        input[type='checkbox'] {
          display: none;
        }

        .label-tag {
          background: var(--dc-bg-secondary);
          border: 1px solid var(--dc-border-subtle);
          transition: all var(--dc-duration-fast);
          color: var(--dc-text-secondary);
        }

        input:checked + .label-tag {
          border-color: transparent;
          color: white;
        }
      }

      .no-labels-hint {
        color: var(--dc-text-placeholder);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class CatalogEntriesComponent implements OnInit {
  readonly store = inject(CatalogStore);
  readonly editorComponent = viewChild<CatalogEntryEditorComponent>(CatalogEntryEditorComponent);

  readonly dataTypes: DataType[] = [
    DataType.String,
    DataType.Bool,
    DataType.Int32,
    DataType.Int64,
    DataType.Float32,
    DataType.Float64,
    DataType.DateTime,
    DataType.Duration,
  ];

  readonly viewModes = [
    { id: 'table' as ViewMode, label: 'Table View', icon: 'table_rows' },
    { id: 'grid' as ViewMode, label: 'Grid View', icon: 'grid_view' },
    { id: 'list' as ViewMode, label: 'List View', icon: 'view_list' },
  ];

  readonly currentView = signal<ViewMode>('table');
  readonly searchQuery = signal('');
  readonly sourceConnectionFilter = signal('');
  readonly sourceTypeFilter = signal('');
  readonly labelFilter = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly sortField = signal<SortField | null>(null);
  readonly sortDirection = signal<SortDirection>('asc');

  private readonly sourceTypeColors: Record<string, string> = {
    DataBridge: 'var(--dc-source-databridge)',
    PostgreSQL: 'var(--dc-source-postgresql)',
    InfluxDB2: 'var(--dc-source-influxdb)',
    MQTT: 'var(--dc-source-mqtt)',
    S3: 'var(--dc-source-s3)',
    Email: 'var(--dc-source-email)',
    Http: 'var(--dc-source-http)',
    'OPC-UA': 'var(--dc-source-opcua)',
    'Modbus-TCP': 'var(--dc-source-modbus)',
    Leneda: 'var(--dc-source-leneda)',
  };

  readonly filteredEntries = computed(() => {
    let entries = this.store.entries();
    const query = this.searchQuery().toLowerCase();
    const sourceConnFilter = this.sourceConnectionFilter().toLowerCase();
    const typeFilter = this.sourceTypeFilter();
    const labelFilterId = this.labelFilter();
    const field = this.sortField();
    const direction = this.sortDirection();

    // Filter by entry name
    if (query) {
      entries = entries.filter((e) => e.name.toLowerCase().includes(query));
    }

    // Filter by source connection name
    if (sourceConnFilter) {
      entries = entries.filter((e) =>
        e.sourceConnection?.name?.toLowerCase().includes(sourceConnFilter)
      );
    }

    // Filter by source type
    if (typeFilter) {
      entries = entries.filter((e) => e.sourceConnection?.sourceType?.name === typeFilter);
    }

    // Filter by label
    if (labelFilterId) {
      entries = entries.filter((e) => e.labels?.some((l) => l.id === labelFilterId));
    }

    // Apply sorting
    if (field) {
      entries = [...entries].sort((a, b) => {
        let aVal: string;
        let bVal: string;

        switch (field) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'dataType':
            aVal = a.dataType.toLowerCase();
            bVal = b.dataType.toLowerCase();
            break;
          case 'sourceConnection':
            aVal = (a.sourceConnection?.name || '').toLowerCase();
            bVal = (b.sourceConnection?.name || '').toLowerCase();
            break;
          case 'labels':
            aVal = (a.labels?.length || 0).toString();
            bVal = (b.labels?.length || 0).toString();
            break;
          default:
            return 0;
        }

        const cmp = aVal.localeCompare(bVal);
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return entries;
  });

  readonly allSelected = computed(() => {
    const entries = this.filteredEntries();
    return entries.length > 0 && entries.every((e) => this.selectedIds().has(e.id));
  });

  readonly someSelected = computed(() => {
    const selected = this.selectedIds();
    const entries = this.filteredEntries();
    return entries.some((e) => selected.has(e.id)) && !this.allSelected();
  });

  ngOnInit(): void {
    if (this.store.entries().length === 0) {
      this.store.loadAll();
    }
  }

  setView(viewId: ViewMode): void {
    this.currentView.set(viewId);
  }

  toggleExpand(id: string): void {
    this.expandedIds.update((ids) => {
      const newSet = new Set(ids);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  getObjectKeys(obj: Record<string, unknown> | undefined): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  formatObjectValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  onSearch(event: Event): void {
    const customEvent = event as CustomEvent;
    this.searchQuery.set(customEvent.detail?.value || '');
  }

  onSourceConnectionFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.sourceConnectionFilter.set(input.value);
  }

  onSourceTypeFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sourceTypeFilter.set(select.value);
  }

  onLabelFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.labelFilter.set(select.value);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      // Toggle direction or clear sort
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortField.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  getSourceColor(type: string | undefined): string {
    return this.sourceTypeColors[type || ''] || 'var(--dc-border-strong)';
  }

  getLabelColor(labelName: string): string {
    return getLabelColor(labelName);
  }

  getObjectPreview(obj: Record<string, unknown> | undefined): string {
    if (!obj || Object.keys(obj).length === 0) {
      return '-';
    }
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      return `${keys[0]}: ${this.formatValue(obj[keys[0]])}`;
    }
    return `${keys.length} properties`;
  }

  formatJson(obj: Record<string, unknown> | undefined): string {
    if (!obj || Object.keys(obj).length === 0) {
      return 'No data';
    }
    return JSON.stringify(obj, null, 2);
  }

  private formatValue(value: unknown): string {
    if (typeof value === 'string') {
      return value.length > 20 ? value.substring(0, 20) + '...' : value;
    }
    return String(value);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((ids) => {
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
      const allIds = this.filteredEntries().map((e) => e.id);
      this.selectedIds.set(new Set(allIds));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  onNewEntry(): void {
    this.editorComponent()?.open();
  }

  onEditEntry(entry: CatalogEntry): void {
    this.editorComponent()?.open(entry);
  }

  onDeleteEntry(entry: CatalogEntry): void {
    if (confirm(`Delete "${entry.name}"?`)) {
      this.store.deleteEntries([entry.id]);
    }
  }

  onBulkDelete(): void {
    const count = this.selectedIds().size;
    if (confirm(`Delete ${count} entries?`)) {
      this.store.deleteEntries(Array.from(this.selectedIds()));
      this.clearSelection();
    }
  }
}

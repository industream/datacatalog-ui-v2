import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import '@carbon/web-components/es/components/button/index.js';

import { AssetDictionary, AssetDictionaryTemplate } from '../../core/models';
import { ConfirmationService } from '../../core/services';
import { AssetDictionaryStore } from './asset-dictionary.store';

@Component({
  selector: 'app-assets',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./assets.component.scss'],
  template: `
    <div class="assets-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Asset Dictionaries</h1>
          <p class="subtitle">Define and manage your asset hierarchies</p>
        </div>
        <cds-button kind="primary" (click)="showCreateModal.set(true)">
          <span class="material-symbols-outlined" slot="icon">add</span>
          New Dictionary
        </cds-button>
      </header>

      @if (store.loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined animate-pulse">sync</span>
          <p>Loading dictionaries...</p>
        </div>
      } @else if (store.dictionaries().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">account_tree</span>
          <h2>No Asset Dictionaries</h2>
          <p>Create your first asset dictionary to organize your catalog entries into a hierarchical structure.</p>
          <cds-button kind="primary" (click)="showCreateModal.set(true)">
            <span class="material-symbols-outlined" slot="icon">add</span>
            Create Dictionary
          </cds-button>
        </div>
      } @else {
        <div class="dictionaries-grid">
          @for (dict of store.dictionaries(); track dict.id) {
            <div class="dictionary-card" (click)="openDictionary(dict)">
              <div class="card-header">
                <div class="card-icon" [style.background]="dict.color || 'var(--dc-primary)'">
                  <span class="material-symbols-outlined">{{ dict.icon || 'account_tree' }}</span>
                </div>
                <div class="card-actions">
                  <button class="icon-btn" title="Edit" (click)="editDictionary(dict); $event.stopPropagation()">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="icon-btn danger" title="Delete" (click)="deleteDictionary(dict); $event.stopPropagation()">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
              <h3 class="card-title">{{ dict.name }}</h3>
              <p class="card-description">{{ dict.description || 'No description' }}</p>
              <div class="card-stats">
                <div class="stat">
                  <span class="material-symbols-outlined">folder</span>
                  {{ countNodes(dict) }} nodes
                </div>
                <div class="stat">
                  <span class="material-symbols-outlined">sell</span>
                  {{ countAssignedTags(dict) }} tags
                </div>
              </div>
              <div class="card-footer">
                <span class="updated">Updated {{ formatDate(dict.updatedAt) }}</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingDict() ? 'Edit Dictionary' : 'New Asset Dictionary' }}</h2>
              <button class="icon-btn" (click)="closeModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="dict-name">Name *</label>
                <input
                  type="text"
                  id="dict-name"
                  class="form-input"
                  [value]="formName()"
                  (input)="onNameInput($event)"
                  placeholder="e.g., Production Assets">
              </div>

              <div class="form-group">
                <label for="dict-description">Description</label>
                <textarea
                  id="dict-description"
                  class="form-textarea"
                  [value]="formDescription()"
                  (input)="onDescriptionInput($event)"
                  placeholder="Describe the purpose of this dictionary..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Icon</label>
                  <div class="icon-selector">
                    @for (icon of availableIcons; track icon) {
                      <button
                        class="icon-option"
                        [class.selected]="formIcon() === icon"
                        (click)="formIcon.set(icon)">
                        <span class="material-symbols-outlined">{{ icon }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label>Color</label>
                  <div class="color-selector">
                    @for (color of availableColors; track color) {
                      <button
                        class="color-option"
                        [class.selected]="formColor() === color"
                        [style.background]="color"
                        (click)="formColor.set(color)">
                      </button>
                    }
                  </div>
                </div>
              </div>

              @if (!editingDict()) {
                <div class="form-group">
                  <label>Start from Template</label>
                  <div class="templates-grid">
                    <button
                      class="template-option"
                      [class.selected]="!selectedTemplate()"
                      (click)="selectedTemplate.set(null)">
                      <span class="material-symbols-outlined">article</span>
                      <span class="template-name">Empty</span>
                      <span class="template-desc">Start from scratch</span>
                    </button>
                    @for (tpl of templates; track tpl.id) {
                      <button
                        class="template-option"
                        [class.selected]="selectedTemplate()?.id === tpl.id"
                        (click)="selectedTemplate.set(tpl)">
                        <span class="material-symbols-outlined">{{ tpl.icon }}</span>
                        <span class="template-name">{{ tpl.name }}</span>
                        <span class="template-desc">{{ tpl.description }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <cds-button kind="ghost" (click)="closeModal()">Cancel</cds-button>
              <cds-button kind="primary" (click)="saveDictionary()" [disabled]="!formName()">
                {{ editingDict() ? 'Update' : 'Create' }}
              </cds-button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AssetsComponent implements OnInit {
  readonly store = inject(AssetDictionaryStore);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly showCreateModal = signal(false);
  readonly editingDict = signal<AssetDictionary | null>(null);
  readonly formName = signal('');
  readonly formDescription = signal('');
  readonly formIcon = signal('account_tree');
  readonly formColor = signal('#0f62fe');
  readonly selectedTemplate = signal<AssetDictionaryTemplate | null>(null);

  readonly availableIcons = [
    'account_tree', 'factory', 'precision_manufacturing', 'engineering',
    'settings', 'bolt', 'memory', 'developer_board', 'dns', 'storage'
  ];

  readonly availableColors = [
    '#0f62fe', '#6929c4', '#1192e8', '#005d5d', '#9f1853',
    '#fa4d56', '#ff832b', '#f1c21b', '#198038', '#002d9c'
  ];

  readonly templates: AssetDictionaryTemplate[] = [
    {
      id: 'industrial-plant',
      name: 'Industrial Plant',
      description: 'Factory with lines & machines',
      icon: 'factory',
      structure: [
        {
          name: 'Plant',
          icon: 'factory',
          children: [
            {
              name: 'Production Line 1',
              icon: 'precision_manufacturing',
              children: [
                { name: 'Machine 1', icon: 'settings' },
                { name: 'Machine 2', icon: 'settings' }
              ]
            },
            {
              name: 'Utilities',
              icon: 'bolt',
              children: [
                { name: 'HVAC', icon: 'air' },
                { name: 'Electrical', icon: 'electrical_services' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'building',
      name: 'Building',
      description: 'Floors, zones, and equipment',
      icon: 'apartment',
      structure: [
        {
          name: 'Building',
          icon: 'apartment',
          children: [
            {
              name: 'Floor 1',
              icon: 'layers',
              children: [
                { name: 'Zone A', icon: 'crop_square' },
                { name: 'Zone B', icon: 'crop_square' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'data-center',
      name: 'Data Center',
      description: 'Racks, servers, and network',
      icon: 'dns',
      structure: [
        {
          name: 'Data Center',
          icon: 'dns',
          children: [
            {
              name: 'Rack 1',
              icon: 'developer_board',
              children: [
                { name: 'Server 1', icon: 'memory' },
                { name: 'Server 2', icon: 'memory' }
              ]
            },
            { name: 'Network', icon: 'lan' }
          ]
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.store.loadDictionaries();
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formName.set(input.value);
  }

  onDescriptionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.formDescription.set(textarea.value);
  }

  openDictionary(dict: AssetDictionary): void {
    this.router.navigate(['/assets', dict.id]);
  }

  editDictionary(dict: AssetDictionary): void {
    this.editingDict.set(dict);
    this.formName.set(dict.name);
    this.formDescription.set(dict.description || '');
    this.formIcon.set(dict.icon || 'account_tree');
    this.formColor.set(dict.color || '#0f62fe');
    this.showCreateModal.set(true);
  }

  async deleteDictionary(dict: AssetDictionary): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Dictionary',
      message: `Delete "${dict.name}"? This will remove all nodes and tag assignments.`,
      confirmText: 'Delete',
      danger: true
    });

    if (confirmed) {
      this.store.deleteDictionary(dict.id);
    }
  }

  closeModal(): void {
    this.showCreateModal.set(false);
    this.editingDict.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formIcon.set('account_tree');
    this.formColor.set('#0f62fe');
    this.selectedTemplate.set(null);
  }

  saveDictionary(): void {
    const name = this.formName();
    if (!name) return;

    const editing = this.editingDict();

    if (editing) {
      this.store.updateDictionary({
        id: editing.id,
        name,
        description: this.formDescription() || undefined,
        icon: this.formIcon(),
        color: this.formColor()
      });
    } else {
      this.store.createDictionary({
        name,
        description: this.formDescription() || undefined,
        icon: this.formIcon(),
        color: this.formColor(),
        templateId: this.selectedTemplate()?.id
      }, this.selectedTemplate() || undefined);
    }

    this.closeModal();
  }

  countNodes(dict: AssetDictionary): number {
    return dict.nodes.length;
  }

  countAssignedTags(dict: AssetDictionary): number {
    return dict.nodes.reduce((sum, node) => sum + node.entryIds.length, 0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
}

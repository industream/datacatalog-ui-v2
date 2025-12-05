import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/services';
import { BaseStore } from './base.store';
import {
  CatalogEntry,
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class EntryStore extends BaseStore {
  private readonly api = inject(ApiService);

  readonly entries = signal<CatalogEntry[]>([]);
  readonly total = computed(() => this.entries().length);

  load(): void {
    this.executeWithLoading(
      this.api.getCatalogEntries(),
      (entries) => this.entries.set(entries),
      'Failed to load entries'
    );
  }

  loadSilently(): void {
    this.executeSilently(
      this.api.getCatalogEntries().pipe(catchError(() => of(this.entries()))),
      (entries) => this.entries.set(entries)
    );
  }

  create(entry: CatalogEntryCreateRequest): void {
    this.executeWithLoading(
      this.api.createCatalogEntries([entry]),
      (created) => this.entries.update(entries => [...entries, ...created]),
      'Failed to create entry'
    );
  }

  update(entry: CatalogEntryAmendRequest): void {
    this.executeWithLoading(
      this.api.updateCatalogEntries([entry]),
      (updated) => this.entries.update(entries =>
        entries.map(e => e.id === entry.id ? { ...e, ...updated[0] } : e)
      ),
      'Failed to update entry'
    );
  }

  delete(ids: string[]): void {
    this.executeWithLoading(
      this.api.deleteCatalogEntries(ids),
      () => this.entries.update(entries => entries.filter(e => !ids.includes(e.id))),
      'Failed to delete entries'
    );
  }

  setEntries(entries: CatalogEntry[]): void {
    this.entries.set(entries);
  }
}

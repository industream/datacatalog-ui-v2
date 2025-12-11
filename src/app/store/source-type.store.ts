import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/services';
import { BaseStore } from './base.store';
import type { SourceType, SourceTypeCreateRequest, SourceTypeReplaceRequest } from '@industream/datacatalog-client/dto';

@Injectable({ providedIn: 'root' })
export class SourceTypeStore extends BaseStore {
  private readonly api = inject(ApiService);

  readonly sourceTypes = signal<SourceType[]>([]);
  readonly total = computed(() => this.sourceTypes().length);

  load(): void {
    this.executeSilently(
      this.api.getSourceTypes(),
      (types) => this.sourceTypes.set(types)
    );
  }

  loadSilently(): void {
    this.executeSilently(
      this.api.getSourceTypes().pipe(catchError(() => of(this.sourceTypes()))),
      (types) => this.sourceTypes.set(types)
    );
  }

  setSourceTypes(types: SourceType[]): void {
    this.sourceTypes.set(types);
  }

  create(sourceType: SourceTypeCreateRequest): void {
    this.executeWithLoading(
      this.api.createSourceTypes([sourceType]),
      (created) => this.sourceTypes.update(types => [...types, ...created]),
      'Failed to create source type'
    );
  }

  update(sourceType: SourceTypeReplaceRequest): void {
    this.executeWithLoading(
      this.api.updateSourceTypes([sourceType]),
      (updated) => {
        this.sourceTypes.update(types =>
          types.map(t => {
            const updatedType = updated.find(u => u.id === t.id);
            return updatedType || t;
          })
        );
      },
      'Failed to update source type'
    );
  }

  delete(ids: string[]): void {
    this.executeWithLoading(
      this.api.deleteSourceTypes(ids),
      () => this.sourceTypes.update(types => types.filter(t => !ids.includes(t.id))),
      'Failed to delete source types'
    );
  }
}

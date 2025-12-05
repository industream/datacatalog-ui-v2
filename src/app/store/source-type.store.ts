import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/services';
import { BaseStore } from './base.store';
import { SourceType } from '../core/models';

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
}

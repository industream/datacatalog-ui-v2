import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/services';
import { BaseStore } from './base.store';
import type { Label } from '@industream/datacatalog-client/dto';

@Injectable({ providedIn: 'root' })
export class LabelStore extends BaseStore {
  private readonly api = inject(ApiService);

  readonly labels = signal<Label[]>([]);
  readonly total = computed(() => this.labels().length);

  load(): void {
    this.executeWithLoading(
      this.api.getLabels(),
      (labels) => this.labels.set(labels),
      'Failed to load labels'
    );
  }

  loadSilently(): void {
    this.executeSilently(
      this.api.getLabels().pipe(catchError(() => of(this.labels()))),
      (labels) => this.labels.set(labels)
    );
  }

  create(label: Omit<Label, 'id'>): void {
    this.executeWithLoading(
      this.api.createLabels([label as Label]),
      (created) => this.labels.update(labels => [...labels, ...created]),
      'Failed to create label'
    );
  }

  delete(ids: string[]): void {
    this.executeWithLoading(
      this.api.deleteLabels(ids),
      () => this.labels.update(labels => labels.filter(l => !ids.includes(l.id))),
      'Failed to delete labels'
    );
  }

  setLabels(labels: Label[]): void {
    this.labels.set(labels);
  }
}

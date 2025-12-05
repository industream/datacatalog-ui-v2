import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/services';
import { BaseStore } from './base.store';
import {
  SourceConnection,
  SourceConnectionCreateRequest,
  SourceConnectionAmendRequest
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class ConnectionStore extends BaseStore {
  private readonly api = inject(ApiService);

  readonly connections = signal<SourceConnection[]>([]);
  readonly total = computed(() => this.connections().length);

  load(): void {
    this.executeWithLoading(
      this.api.getSourceConnections(),
      (connections) => this.connections.set(connections),
      'Failed to load source connections'
    );
  }

  loadSilently(): void {
    this.executeSilently(
      this.api.getSourceConnections().pipe(catchError(() => of(this.connections()))),
      (connections) => this.connections.set(connections)
    );
  }

  create(connection: SourceConnectionCreateRequest): void {
    this.executeWithLoading(
      this.api.createSourceConnections([connection]),
      (created) => this.connections.update(conns => [...conns, ...created]),
      'Failed to create source connection'
    );
  }

  update(connection: SourceConnectionAmendRequest): void {
    this.executeWithLoading(
      this.api.updateSourceConnections([connection]),
      (updated) => this.connections.update(conns =>
        conns.map(c => c.id === connection.id ? { ...c, ...updated[0] } : c)
      ),
      'Failed to update source connection'
    );
  }

  delete(ids: string[]): void {
    this.executeWithLoading(
      this.api.deleteSourceConnections(ids),
      () => this.connections.update(conns => conns.filter(c => !ids.includes(c.id))),
      'Failed to delete source connections'
    );
  }

  setConnections(connections: SourceConnection[]): void {
    this.connections.set(connections);
  }
}

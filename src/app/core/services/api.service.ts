import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ItemCollection,
  CatalogEntry,
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest,
  SourceConnection,
  SourceConnectionCreateRequest,
  SourceConnectionAmendRequest,
  Label,
  SourceType,
  ApiInfo,
  ConflictStrategy
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ============ API Info ============
  getInfo(): Observable<ApiInfo> {
    return this.http.get<ApiInfo>(`${this.baseUrl}/info`);
  }

  getHealth(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============ Catalog Entries ============
  getCatalogEntries(filters?: {
    ids?: string[];
    names?: string[];
    sourceTypes?: string[];
  }): Observable<CatalogEntry[]> {
    let params = new HttpParams();
    if (filters?.ids) {
      filters.ids.forEach(id => params = params.append('ids', id));
    }
    if (filters?.names) {
      filters.names.forEach(name => params = params.append('names', name));
    }
    if (filters?.sourceTypes) {
      filters.sourceTypes.forEach(type => params = params.append('sourceTypes', type));
    }
    return this.http.get<ItemCollection<CatalogEntry>>(`${this.baseUrl}/catalog-entries/`, { params })
      .pipe(map(res => res.items));
  }

  createCatalogEntries(entries: CatalogEntryCreateRequest[]): Observable<CatalogEntry[]> {
    return this.http.post<ItemCollection<CatalogEntry>>(`${this.baseUrl}/catalog-entries/`, { items: entries })
      .pipe(map(res => res.items));
  }

  updateCatalogEntries(entries: CatalogEntryAmendRequest[]): Observable<CatalogEntry[]> {
    return this.http.patch<ItemCollection<CatalogEntry>>(`${this.baseUrl}/catalog-entries/`, { items: entries })
      .pipe(map(res => res.items));
  }

  deleteCatalogEntries(ids: string[]): Observable<void> {
    let params = new HttpParams();
    ids.forEach(id => params = params.append('ids', id));
    return this.http.delete<void>(`${this.baseUrl}/catalog-entries/`, { params });
  }

  exportCatalogEntries(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/catalog-entries/export`, {
      responseType: 'blob',
      headers: { Accept: 'text/csv' }
    });
  }

  importCatalogEntries(file: File, conflictStrategy: ConflictStrategy): Observable<void> {
    const formData = new FormData();
    formData.append('csvFile', file);
    const params = new HttpParams().set('conflictStrategy', conflictStrategy);
    return this.http.post<void>(`${this.baseUrl}/catalog-entries/import`, formData, { params });
  }

  // ============ Source Connections ============
  getSourceConnections(filters?: {
    ids?: string[];
    names?: string[];
    sourceTypes?: string[];
  }): Observable<SourceConnection[]> {
    let params = new HttpParams();
    if (filters?.ids) {
      filters.ids.forEach(id => params = params.append('ids', id));
    }
    if (filters?.names) {
      filters.names.forEach(name => params = params.append('names', name));
    }
    if (filters?.sourceTypes) {
      filters.sourceTypes.forEach(type => params = params.append('sourceTypes', type));
    }
    return this.http.get<ItemCollection<SourceConnection>>(`${this.baseUrl}/source-connections/`, { params })
      .pipe(map(res => res.items));
  }

  createSourceConnections(connections: SourceConnectionCreateRequest[]): Observable<SourceConnection[]> {
    return this.http.post<ItemCollection<SourceConnection>>(`${this.baseUrl}/source-connections/`, { items: connections })
      .pipe(map(res => res.items));
  }

  updateSourceConnections(connections: SourceConnectionAmendRequest[]): Observable<SourceConnection[]> {
    return this.http.patch<ItemCollection<SourceConnection>>(`${this.baseUrl}/source-connections/`, { items: connections })
      .pipe(map(res => res.items));
  }

  deleteSourceConnections(ids: string[]): Observable<void> {
    let params = new HttpParams();
    ids.forEach(id => params = params.append('ids', id));
    return this.http.delete<void>(`${this.baseUrl}/source-connections/`, { params });
  }

  // ============ Labels ============
  getLabels(filters?: {
    ids?: string[];
    names?: string[];
  }): Observable<Label[]> {
    let params = new HttpParams();
    if (filters?.ids) {
      filters.ids.forEach(id => params = params.append('ids', id));
    }
    if (filters?.names) {
      filters.names.forEach(name => params = params.append('names', name));
    }
    return this.http.get<ItemCollection<Label>>(`${this.baseUrl}/labels/`, { params })
      .pipe(map(res => res.items));
  }

  createLabels(labels: Label[]): Observable<Label[]> {
    return this.http.post<ItemCollection<Label>>(`${this.baseUrl}/labels/`, { items: labels })
      .pipe(map(res => res.items));
  }

  deleteLabels(ids: string[]): Observable<void> {
    let params = new HttpParams();
    ids.forEach(id => params = params.append('ids', id));
    return this.http.delete<void>(`${this.baseUrl}/labels/`, { params });
  }

  // ============ Source Types ============
  getSourceTypes(filters?: {
    ids?: string[];
    names?: string[];
  }): Observable<SourceType[]> {
    let params = new HttpParams();
    if (filters?.ids) {
      filters.ids.forEach(id => params = params.append('ids', id));
    }
    if (filters?.names) {
      filters.names.forEach(name => params = params.append('names', name));
    }
    return this.http.get<ItemCollection<SourceType>>(`${this.baseUrl}/source-types/`, { params })
      .pipe(map(res => res.items));
  }
}

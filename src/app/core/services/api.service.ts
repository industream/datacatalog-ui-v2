import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import type {
  ItemCollection,
  CatalogEntry,
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest,
  SourceConnection,
  SourceConnectionCreateRequest,
  SourceConnectionAmendRequest,
  Label,
  SourceType,
  SourceTypeCreateRequest,
  SourceTypeReplaceRequest,
  Info as ApiInfo,
  ConflictStrategy,
  AssetDictionary,
  AssetDictionaryCreateRequest,
  AssetDictionaryAmendRequest,
  AssetNode,
  AssetNodeCreateRequest,
  AssetNodeAmendRequest,
  AssetNodeMoveRequest
} from '@industream/datacatalog-client/dto';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  private get baseUrl(): string {
    return this.configService.apiUrl;
  }

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
    return this.http.put<ItemCollection<CatalogEntry>>(`${this.baseUrl}/catalog-entries/`, { items: entries })
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
    return this.http.put<ItemCollection<SourceConnection>>(`${this.baseUrl}/source-connections/`, { items: connections })
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

  createSourceTypes(sourceTypes: SourceTypeCreateRequest[]): Observable<SourceType[]> {
    return this.http.post<ItemCollection<SourceType>>(`${this.baseUrl}/source-types/`, { items: sourceTypes })
      .pipe(map(res => res.items));
  }

  updateSourceTypes(sourceTypes: SourceTypeReplaceRequest[]): Observable<SourceType[]> {
    return this.http.put<ItemCollection<SourceType>>(`${this.baseUrl}/source-types/`, { items: sourceTypes })
      .pipe(map(res => res.items));
  }

  deleteSourceTypes(ids: string[]): Observable<void> {
    let params = new HttpParams();
    ids.forEach(id => params = params.append('ids', id));
    return this.http.delete<void>(`${this.baseUrl}/source-types/`, { params });
  }

  // ============ Asset Dictionaries ============
  getAssetDictionaries(filters?: {
    ids?: string[];
    names?: string[];
    includeNodes?: boolean;
    asTree?: boolean;
  }): Observable<AssetDictionary[]> {
    let params = new HttpParams();
    if (filters?.ids) {
      filters.ids.forEach(id => params = params.append('ids', id));
    }
    if (filters?.names) {
      filters.names.forEach(name => params = params.append('names', name));
    }
    if (filters?.includeNodes !== undefined) {
      params = params.set('includeNodes', String(filters.includeNodes));
    }
    if (filters?.asTree !== undefined) {
      params = params.set('asTree', String(filters.asTree));
    }
    const url = `${this.baseUrl}/asset-dictionaries/`;
    console.log('[ApiService] GET asset-dictionaries URL:', url, 'params:', params.toString());
    return this.http.get<ItemCollection<AssetDictionary>>(url, { params })
      .pipe(
        tap(res => console.log('[ApiService] Raw response:', res)),
        map(res => res.items)
      );
  }

  getAssetDictionaryById(id: string, options?: {
    includeNodes?: boolean;
    asTree?: boolean;
  }): Observable<AssetDictionary> {
    let params = new HttpParams();
    if (options?.includeNodes !== undefined) {
      params = params.set('includeNodes', String(options.includeNodes));
    }
    if (options?.asTree !== undefined) {
      params = params.set('asTree', String(options.asTree));
    }
    return this.http.get<AssetDictionary>(`${this.baseUrl}/asset-dictionaries/${id}`, { params });
  }

  createAssetDictionaries(dictionaries: AssetDictionaryCreateRequest[]): Observable<AssetDictionary[]> {
    return this.http.post<ItemCollection<AssetDictionary>>(`${this.baseUrl}/asset-dictionaries/`, { items: dictionaries })
      .pipe(map(res => res.items));
  }

  updateAssetDictionary(request: AssetDictionaryAmendRequest): Observable<AssetDictionary> {
    return this.http.put<AssetDictionary>(`${this.baseUrl}/asset-dictionaries/`, request);
  }

  deleteAssetDictionaries(ids: string[]): Observable<void> {
    let params = new HttpParams();
    ids.forEach(id => params = params.append('ids', id));
    return this.http.delete<void>(`${this.baseUrl}/asset-dictionaries/`, { params });
  }

  // ============ Asset Nodes ============
  getAssetNodes(dictionaryId: string, nodeIds?: string[]): Observable<AssetNode[]> {
    let params = new HttpParams();
    if (nodeIds) {
      nodeIds.forEach(id => params = params.append('ids', id));
    }
    return this.http.get<ItemCollection<AssetNode>>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes`, { params })
      .pipe(map(res => res.items));
  }

  createAssetNode(dictionaryId: string, node: Omit<AssetNodeCreateRequest, 'dictionaryId'>): Observable<AssetNode> {
    return this.http.post<AssetNode>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes`, node);
  }

  updateAssetNode(dictionaryId: string, request: Omit<AssetNodeAmendRequest, 'dictionaryId'>): Observable<AssetNode> {
    return this.http.put<AssetNode>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes`, request);
  }

  moveAssetNode(dictionaryId: string, nodeId: string, request: AssetNodeMoveRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes/${nodeId}/move`, request);
  }

  deleteAssetNode(dictionaryId: string, nodeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes/${nodeId}`);
  }

  // ============ Asset Node Entry Assignments ============
  assignEntriesToNode(dictionaryId: string, nodeId: string, entryIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes/${nodeId}/entries`, { entryIds });
  }

  addEntryToNode(dictionaryId: string, nodeId: string, entryId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes/${nodeId}/entries/${entryId}`, {});
  }

  removeEntryFromNode(dictionaryId: string, nodeId: string, entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/asset-dictionaries/${dictionaryId}/nodes/${nodeId}/entries/${entryId}`);
  }
}

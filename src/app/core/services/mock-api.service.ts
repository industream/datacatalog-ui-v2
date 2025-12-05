import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  CatalogEntry,
  CatalogEntryCreateRequest,
  CatalogEntryAmendRequest,
  SourceConnection,
  SourceConnectionCreateRequest,
  SourceConnectionAmendRequest,
  Label,
  SourceType,
  ApiInfo,
  ConflictStrategy,
  AssetDictionary,
  AssetDictionaryCreateRequest,
  AssetDictionaryAmendRequest,
  AssetNode,
  AssetNodeCreateRequest,
  AssetNodeAmendRequest,
  AssetNodeMoveRequest,
  DataType
} from '../models';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  private readonly DELAY = 300;

  // Mock data stores
  private sourceTypes: SourceType[] = [
    { id: 'st-1', name: 'PostgreSQL' },
    { id: 'st-2', name: 'MySQL' },
    { id: 'st-3', name: 'MongoDB' },
    { id: 'st-4', name: 'REST API' },
    { id: 'st-5', name: 'S3 Bucket' }
  ];

  private sourceConnections: SourceConnection[] = [
    { id: 'sc-1', name: 'Production DB', sourceType: this.sourceTypes[0], connectionParams: { host: 'prod.db.local', port: 5432 } },
    { id: 'sc-2', name: 'Analytics DB', sourceType: this.sourceTypes[0], connectionParams: { host: 'analytics.db.local', port: 5432 } },
    { id: 'sc-3', name: 'User Service API', sourceType: this.sourceTypes[3], connectionParams: { url: 'https://api.users.local' } }
  ];

  private labels: Label[] = [
    { id: 'lbl-1', name: 'PII' },
    { id: 'lbl-2', name: 'Financial' },
    { id: 'lbl-3', name: 'Public' },
    { id: 'lbl-4', name: 'Deprecated' },
    { id: 'lbl-5', name: 'Core' }
  ];

  private catalogEntries: CatalogEntry[] = [
    { id: 'ce-1', name: 'users', dataType: DataType.String, sourceConnection: this.sourceConnections[0], sourceParams: { schema: 'public' }, metadata: {}, labels: [this.labels[0], this.labels[4]] },
    { id: 'ce-2', name: 'orders', dataType: DataType.String, sourceConnection: this.sourceConnections[0], sourceParams: { schema: 'public' }, metadata: {}, labels: [this.labels[1], this.labels[4]] },
    { id: 'ce-3', name: 'products', dataType: DataType.String, sourceConnection: this.sourceConnections[0], sourceParams: { schema: 'public' }, metadata: {}, labels: [this.labels[2]] },
    { id: 'ce-4', name: 'analytics_events', dataType: DataType.String, sourceConnection: this.sourceConnections[1], sourceParams: { schema: 'events' }, metadata: {}, labels: [] },
    { id: 'ce-5', name: 'user_sessions', dataType: DataType.String, sourceConnection: this.sourceConnections[1], sourceParams: { schema: 'events' }, metadata: {}, labels: [this.labels[0]] },
    { id: 'ce-6', name: '/users/{id}', dataType: DataType.String, sourceConnection: this.sourceConnections[2], sourceParams: { method: 'GET' }, metadata: {}, labels: [this.labels[0]] },
    { id: 'ce-7', name: 'payments', dataType: DataType.String, sourceConnection: this.sourceConnections[0], sourceParams: { schema: 'billing' }, metadata: {}, labels: [this.labels[1], this.labels[0]] },
    { id: 'ce-8', name: 'invoices', dataType: DataType.String, sourceConnection: this.sourceConnections[0], sourceParams: { schema: 'billing' }, metadata: {}, labels: [this.labels[1]] }
  ];

  private assetDictionaries: AssetDictionary[] = [];
  private nodeIdCounter = 1;
  private dictIdCounter = 1;

  // ============ API Info ============
  getInfo(): Observable<ApiInfo> {
    return of({
      version: '1.0.0-mock',
      name: 'DataCatalog Mock API'
    } as ApiInfo).pipe(delay(this.DELAY));
  }

  getHealth(): Observable<unknown> {
    return of({ status: 'ok' }).pipe(delay(this.DELAY));
  }

  // ============ Catalog Entries ============
  getCatalogEntries(filters?: {
    ids?: string[];
    names?: string[];
    sourceTypes?: string[];
  }): Observable<CatalogEntry[]> {
    let result = [...this.catalogEntries];
    if (filters?.ids?.length) {
      result = result.filter(e => filters.ids!.includes(e.id));
    }
    if (filters?.names?.length) {
      result = result.filter(e => filters.names!.includes(e.name));
    }
    return of(result).pipe(delay(this.DELAY));
  }

  createCatalogEntries(entries: CatalogEntryCreateRequest[]): Observable<CatalogEntry[]> {
    const created = entries.map((e, i) => ({
      id: `ce-${Date.now()}-${i}`,
      name: e.name,
      dataType: e.dataType,
      sourceConnection: this.sourceConnections.find(sc => sc.id === e.sourceConnectionId) || this.sourceConnections[0],
      sourceParams: e.sourceParams || {},
      metadata: e.metadata || {},
      labels: e.labelIds?.map(id => this.labels.find(l => l.id === id)!).filter(Boolean) || []
    }));
    this.catalogEntries.push(...created);
    return of(created).pipe(delay(this.DELAY));
  }

  updateCatalogEntries(entries: CatalogEntryAmendRequest[]): Observable<CatalogEntry[]> {
    const updated: CatalogEntry[] = [];
    entries.forEach(req => {
      const entry = this.catalogEntries.find(e => e.id === req.id);
      if (entry) {
        if (req.name) entry.name = req.name;
        if (req.dataType) entry.dataType = req.dataType;
        if (req.sourceParams) entry.sourceParams = req.sourceParams;
        if (req.metadata) entry.metadata = req.metadata;
        if (req.labelIds) entry.labels = req.labelIds.map(id => this.labels.find(l => l.id === id)!).filter(Boolean);
        updated.push(entry);
      }
    });
    return of(updated).pipe(delay(this.DELAY));
  }

  deleteCatalogEntries(ids: string[]): Observable<void> {
    this.catalogEntries = this.catalogEntries.filter(e => !ids.includes(e.id));
    return of(undefined).pipe(delay(this.DELAY));
  }

  exportCatalogEntries(): Observable<Blob> {
    const csv = 'id,name,dataType\n' + this.catalogEntries.map(e => `${e.id},${e.name},${e.dataType}`).join('\n');
    return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(this.DELAY));
  }

  importCatalogEntries(file: File, conflictStrategy: ConflictStrategy): Observable<void> {
    return of(undefined).pipe(delay(this.DELAY));
  }

  // ============ Source Connections ============
  getSourceConnections(filters?: {
    ids?: string[];
    names?: string[];
    sourceTypes?: string[];
  }): Observable<SourceConnection[]> {
    let result = [...this.sourceConnections];
    if (filters?.ids?.length) {
      result = result.filter(sc => filters.ids!.includes(sc.id));
    }
    return of(result).pipe(delay(this.DELAY));
  }

  createSourceConnections(connections: SourceConnectionCreateRequest[]): Observable<SourceConnection[]> {
    const created = connections.map((c, i) => ({
      id: `sc-${Date.now()}-${i}`,
      name: c.name,
      sourceType: this.sourceTypes.find(st => st.id === c.sourceTypeId) || this.sourceTypes[0],
      connectionParams: c['connectionParams'] || {}
    }));
    this.sourceConnections.push(...created);
    return of(created).pipe(delay(this.DELAY));
  }

  updateSourceConnections(connections: SourceConnectionAmendRequest[]): Observable<SourceConnection[]> {
    const updated: SourceConnection[] = [];
    connections.forEach(req => {
      const conn = this.sourceConnections.find(c => c.id === req.id);
      if (conn) {
        if (req.name) conn.name = req.name;
        if (req['connectionParams']) conn['connectionParams'] = req['connectionParams'];
        updated.push(conn);
      }
    });
    return of(updated).pipe(delay(this.DELAY));
  }

  deleteSourceConnections(ids: string[]): Observable<void> {
    this.sourceConnections = this.sourceConnections.filter(c => !ids.includes(c.id));
    return of(undefined).pipe(delay(this.DELAY));
  }

  // ============ Labels ============
  getLabels(filters?: { ids?: string[]; names?: string[] }): Observable<Label[]> {
    let result = [...this.labels];
    if (filters?.ids?.length) {
      result = result.filter(l => filters.ids!.includes(l.id));
    }
    return of(result).pipe(delay(this.DELAY));
  }

  createLabels(labels: Label[]): Observable<Label[]> {
    const created = labels.map((l, i) => ({
      id: `lbl-${Date.now()}-${i}`,
      name: l.name
    }));
    this.labels.push(...created);
    return of(created).pipe(delay(this.DELAY));
  }

  deleteLabels(ids: string[]): Observable<void> {
    this.labels = this.labels.filter(l => !ids.includes(l.id));
    return of(undefined).pipe(delay(this.DELAY));
  }

  // ============ Source Types ============
  getSourceTypes(filters?: { ids?: string[]; names?: string[] }): Observable<SourceType[]> {
    let result = [...this.sourceTypes];
    if (filters?.ids?.length) {
      result = result.filter(st => filters.ids!.includes(st.id));
    }
    return of(result).pipe(delay(this.DELAY));
  }

  // ============ Asset Dictionaries ============
  getAssetDictionaries(filters?: {
    ids?: string[];
    names?: string[];
    includeNodes?: boolean;
    asTree?: boolean;
  }): Observable<AssetDictionary[]> {
    let result = this.assetDictionaries.map(d => ({
      ...d,
      nodes: filters?.includeNodes ? d.nodes : []
    }));
    if (filters?.ids?.length) {
      result = result.filter(d => filters.ids!.includes(d.id));
    }
    return of(result).pipe(delay(this.DELAY));
  }

  getAssetDictionaryById(id: string, options?: {
    includeNodes?: boolean;
    asTree?: boolean;
  }): Observable<AssetDictionary> {
    const dict = this.assetDictionaries.find(d => d.id === id);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    return of({
      ...dict,
      nodes: options?.includeNodes ? dict.nodes : []
    }).pipe(delay(this.DELAY));
  }

  createAssetDictionaries(dictionaries: AssetDictionaryCreateRequest[]): Observable<AssetDictionary[]> {
    const now = new Date().toISOString();
    const created = dictionaries.map(d => ({
      id: `dict-${this.dictIdCounter++}`,
      name: d.name,
      description: d.description,
      icon: d.icon || 'account_tree',
      color: d.color || '#0f62fe',
      nodes: [],
      createdAt: now,
      updatedAt: now
    }));
    this.assetDictionaries.push(...created);
    return of(created).pipe(delay(this.DELAY));
  }

  updateAssetDictionary(request: AssetDictionaryAmendRequest): Observable<AssetDictionary> {
    const dict = this.assetDictionaries.find(d => d.id === request.id);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    if (request.name) dict.name = request.name;
    if (request.description !== undefined) dict.description = request.description;
    if (request.icon) dict.icon = request.icon;
    if (request.color) dict.color = request.color;
    dict.updatedAt = new Date().toISOString();
    return of(dict).pipe(delay(this.DELAY));
  }

  deleteAssetDictionaries(ids: string[]): Observable<void> {
    this.assetDictionaries = this.assetDictionaries.filter(d => !ids.includes(d.id));
    return of(undefined).pipe(delay(this.DELAY));
  }

  // ============ Asset Nodes ============
  getAssetNodes(dictionaryId: string, nodeIds?: string[]): Observable<AssetNode[]> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return of([]);
    }
    let nodes = [...dict.nodes];
    if (nodeIds?.length) {
      nodes = nodes.filter(n => nodeIds.includes(n.id));
    }
    return of(nodes).pipe(delay(this.DELAY));
  }

  createAssetNode(dictionaryId: string, node: Omit<AssetNodeCreateRequest, 'dictionaryId'>): Observable<AssetNode> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    const newNode: AssetNode = {
      id: `node-${this.nodeIdCounter++}`,
      dictionaryId,
      name: node.name,
      description: node.description,
      icon: node.icon || 'folder',
      parentId: node.parentId || null,
      order: node.order ?? dict.nodes.filter(n => n.parentId === node.parentId).length,
      entryIds: []
    };
    dict.nodes.push(newNode);
    dict.updatedAt = new Date().toISOString();
    return of(newNode).pipe(delay(this.DELAY));
  }

  updateAssetNode(dictionaryId: string, request: Omit<AssetNodeAmendRequest, 'dictionaryId'>): Observable<AssetNode> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    const node = dict.nodes.find(n => n.id === request.id);
    if (!node) {
      return throwError(() => new Error('Node not found'));
    }
    if (request.name) node.name = request.name;
    if (request.description !== undefined) node.description = request.description;
    if (request.icon) node.icon = request.icon;
    if (request.parentId !== undefined) node.parentId = request.parentId;
    if (request.order !== undefined) node.order = request.order;
    dict.updatedAt = new Date().toISOString();
    return of(node).pipe(delay(this.DELAY));
  }

  moveAssetNode(dictionaryId: string, nodeId: string, request: AssetNodeMoveRequest): Observable<void> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    const node = dict.nodes.find(n => n.id === nodeId);
    if (!node) {
      return throwError(() => new Error('Node not found'));
    }
    node.parentId = request.newParentId;
    node.order = request.newOrder;
    dict.updatedAt = new Date().toISOString();
    return of(undefined).pipe(delay(this.DELAY));
  }

  deleteAssetNode(dictionaryId: string, nodeId: string): Observable<void> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    // Delete node and all descendants
    const idsToDelete = new Set<string>([nodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      dict.nodes.forEach(n => {
        if (n.parentId && idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
          idsToDelete.add(n.id);
          changed = true;
        }
      });
    }
    dict.nodes = dict.nodes.filter(n => !idsToDelete.has(n.id));
    dict.updatedAt = new Date().toISOString();
    return of(undefined).pipe(delay(this.DELAY));
  }

  // ============ Asset Node Entry Assignments ============
  assignEntriesToNode(dictionaryId: string, nodeId: string, entryIds: string[]): Observable<void> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    const node = dict.nodes.find(n => n.id === nodeId);
    if (!node) {
      return throwError(() => new Error('Node not found'));
    }
    node.entryIds = entryIds;
    dict.updatedAt = new Date().toISOString();
    return of(undefined).pipe(delay(this.DELAY));
  }

  addEntryToNode(dictionaryId: string, nodeId: string, entryId: string): Observable<void> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    const node = dict.nodes.find(n => n.id === nodeId);
    if (!node) {
      return throwError(() => new Error('Node not found'));
    }
    if (!node.entryIds.includes(entryId)) {
      node.entryIds.push(entryId);
    }
    dict.updatedAt = new Date().toISOString();
    return of(undefined).pipe(delay(this.DELAY));
  }

  removeEntryFromNode(dictionaryId: string, nodeId: string, entryId: string): Observable<void> {
    const dict = this.assetDictionaries.find(d => d.id === dictionaryId);
    if (!dict) {
      return throwError(() => new Error('Dictionary not found'));
    }
    const node = dict.nodes.find(n => n.id === nodeId);
    if (!node) {
      return throwError(() => new Error('Node not found'));
    }
    node.entryIds = node.entryIds.filter(id => id !== entryId);
    dict.updatedAt = new Date().toISOString();
    return of(undefined).pipe(delay(this.DELAY));
  }
}

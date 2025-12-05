// Data Types Enum
export enum DataType {
  Bool = 'Bool',
  String = 'String',
  Int8 = 'Int8',
  Int16 = 'Int16',
  Int32 = 'Int32',
  Int64 = 'Int64',
  UInt8 = 'UInt8',
  UInt16 = 'UInt16',
  UInt32 = 'UInt32',
  UInt64 = 'UInt64',
  Float32 = 'Float32',
  Float64 = 'Float64',
  DateTime = 'DateTime',
  Duration = 'Duration'
}

// Conflict Strategy for imports
export enum ConflictStrategy {
  Skip = 'Skip',
  Replace = 'Replace',
  Fail = 'Fail'
}

// API Response Wrapper
export interface ItemCollection<T> {
  items: T[];
}

// Label
export interface Label {
  id: string;
  name: string;
}

// Source Type
export interface SourceType {
  id: string;
  name: string;
}

// Source Connection
export interface SourceConnection {
  id: string;
  name: string;
  sourceType: SourceType;
  [key: string]: unknown; // Extension data for source-specific config
}

export interface SourceConnectionCreateRequest {
  name: string;
  sourceTypeId: string;
  [key: string]: unknown;
}

export interface SourceConnectionAmendRequest {
  id: string;
  name?: string;
  sourceTypeId?: string;
  [key: string]: unknown;
}

// Catalog Entry
export interface CatalogEntry {
  id: string;
  name: string;
  dataType: DataType;
  metadata?: Record<string, unknown>;
  sourceParams: Record<string, unknown>;
  sourceConnection: SourceConnection;
  labels?: Label[];
}

export interface CatalogEntryCreateRequest {
  name: string;
  dataType: DataType;
  metadata?: Record<string, unknown>;
  sourceParams: Record<string, unknown>;
  sourceConnectionId: string;
  labelIds?: string[];
}

export interface CatalogEntryAmendRequest {
  id: string;
  name?: string;
  dataType?: DataType;
  metadata?: Record<string, unknown>;
  sourceParams?: Record<string, unknown>;
  sourceConnectionId?: string;
  labelIds?: string[];
}

// API Info
export interface ApiInfo {
  name: string;
  version: string;
  databaseName: string;
  databaseVersion: string;
}

// Dashboard Statistics (computed from API data)
export interface DashboardStats {
  totalEntries: number;
  totalSources: number;
  totalLabels: number;
  sourceTypes: number;
  entriesBySourceType: { type: string; count: number; percentage: number; color: string }[];
}

// ==========================================
// Asset Dictionary Models
// ==========================================

// Asset Node - represents a node in the asset hierarchy tree
export interface AssetNode {
  id: string;
  dictionaryId: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  order: number;
  // Assigned catalog entry IDs (tags)
  entryIds: string[];
  // For UI tree state
  children?: AssetNode[];
  expanded?: boolean;
}

// Asset Dictionary - a complete asset tree configuration
export interface AssetDictionary {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  // Template used to create this dictionary (if any)
  templateId?: string;
  // Root nodes of the tree
  nodes: AssetNode[];
}

// Asset Dictionary Create Request
export interface AssetDictionaryCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  templateId?: string;
}

// Asset Dictionary Amend Request
export interface AssetDictionaryAmendRequest {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Asset Node Create Request
export interface AssetNodeCreateRequest {
  dictionaryId: string;
  name: string;
  description?: string;
  icon?: string;
  parentId: string | null;
  order?: number;
}

// Asset Node Amend Request
export interface AssetNodeAmendRequest {
  id: string;
  dictionaryId: string;
  name?: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
}

// Assign entries to a node
export interface AssetNodeAssignEntriesRequest {
  nodeId: string;
  dictionaryId: string;
  entryIds: string[];
}

// Move a node request
export interface AssetNodeMoveRequest {
  newParentId: string | null;
  newOrder: number;
}

// Asset Dictionary Template - predefined hierarchy structures (UI-only)
export interface AssetDictionaryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  // Template nodes (without IDs, will be generated on use)
  structure: AssetTemplateNode[];
}

export interface AssetTemplateNode {
  name: string;
  description?: string;
  icon?: string;
  children?: AssetTemplateNode[];
}

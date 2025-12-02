# DataCatalog UI V2 - Requirements Specification

## 1. Functional Requirements

### 1.1 Dashboard (NEW)

#### FR-DASH-001: Overview Statistics
- Display total count of Catalog Entries, Source Connections, Labels, and Source Types
- Show trend indicators (up/down/stable) compared to last week
- Auto-refresh every 60 seconds

#### FR-DASH-002: Distribution Chart
- Donut chart showing entries distribution by Source Type
- Interactive: click on segment to filter Explorer view
- Color-coded by source type

#### FR-DASH-003: Recent Activity Feed
- Show last 20 actions (create, update, delete, import)
- Display timestamp, action type, entity name, and user
- Click to navigate to the affected entity

#### FR-DASH-004: Quick Actions Panel
- Buttons for: New Entry, New Source, Import CSV, Export All
- Keyboard shortcuts displayed on hover

---

### 1.2 Explorer (Catalog Entries)

#### FR-EXP-001: Multiple View Modes
- **List View**: Compact rows with essential info
- **Grid View**: Cards with preview (current default)
- **Table View**: Spreadsheet-like with sortable columns
- **Graph View**: Visual relationship map
- Persist user's preferred view in localStorage

#### FR-EXP-002: Advanced Search & Filtering
- Full-text search across name, description, metadata
- Filter by: Source Type, Source Connection, Labels, Data Type
- Combine multiple filters with AND logic
- Save/load filter presets

#### FR-EXP-003: Virtual Scrolling
- Render only visible items (viewport + buffer)
- Support 10,000+ entries without performance degradation
- Smooth scrolling with 60fps

#### FR-EXP-004: Bulk Operations
- Select multiple entries (checkbox, Shift+click for range)
- Select all (filtered results)
- Bulk actions: Delete, Add Labels, Remove Labels, Export
- Confirmation dialog for destructive actions

#### FR-EXP-005: Inline Editing (Table View)
- Double-click cell to edit Name, Data Type
- Auto-save on blur with debounce (500ms)
- Visual feedback: saving indicator, success/error state
- Undo last change (Ctrl+Z)

#### FR-EXP-006: Column Customization (Table View)
- Show/hide columns via dropdown
- Reorder columns via drag-and-drop
- Persist column configuration

#### FR-EXP-007: Sorting
- Click column header to sort (asc/desc/none)
- Multi-column sort with Shift+click
- Visual indicators for sort direction

#### FR-EXP-008: Export Options
- Export formats: CSV, JSON, XLSX
- Export: All entries, Filtered entries, Selected entries
- Include/exclude metadata option

---

### 1.3 Source Connections

#### FR-SRC-001: Connection Management
- CRUD operations for source connections
- Dynamic form based on source type
- Default fields per type (PostgreSQL, InfluxDB, MQTT, OPC-UA, etc.)

#### FR-SRC-002: Credential Security
- Mask sensitive fields (password, token, apiKey)
- Show/hide toggle for masked fields
- Never log or expose credentials

#### FR-SRC-003: Connection Testing
- "Test Connection" button for applicable types
- Display success/failure with detailed message
- Timeout after 10 seconds

#### FR-SRC-004: Dependent Entries Display
- Show count of Catalog Entries using this connection
- Warning before deleting connection with entries
- Option to reassign entries to another connection

---

### 1.4 Asset Dictionaries (NEW)

#### FR-AST-001: Dictionary Management
- CRUD operations for asset dictionaries
- Custom name, description, icon, and color for each dictionary
- Template-based creation (predefined structures)
- Persist to localStorage (API-ready architecture)

#### FR-AST-002: Hierarchical Node Structure
- Unlimited depth tree structure for organizing assets
- Each node has: name, description, icon, order
- Support for nested child nodes
- Flat storage with parent references (efficient for operations)

#### FR-AST-003: Tree Editor Interface
- Visual tree representation with expand/collapse
- Drag-and-drop reordering and reparenting
- Inline node creation and editing
- Delete nodes with cascade (children removed)
- Context menu for node actions

#### FR-AST-004: Drag & Drop Operations
- Drag nodes to new positions within same parent (reorder)
- Drag nodes to different parent (reparenting)
- Visual drop indicators (before, after, inside)
- Circular reference prevention
- Undo/redo support (future)

#### FR-AST-005: Entry Assignment
- Assign Catalog Entries to tree nodes (tagging)
- Bulk assign/unassign entries
- Visual count of assigned entries per node
- Filter Explorer by asset node

#### FR-AST-006: Dictionary Templates
- Predefined templates: Data Classification, Data Domain, Business Glossary
- Custom template creation (future)
- Apply template to new dictionary

---

### 1.5 Labels

#### FR-LBL-001: Label Management
- CRUD operations for labels
- Color assignment (predefined palette or custom)
- Icon assignment (optional)

#### FR-LBL-002: Label Usage Stats
- Show count of entries per label
- Sort labels by usage

#### FR-LBL-003: Bulk Label Assignment
- Select entries in Explorer, apply labels
- Remove labels from multiple entries

---

### 1.6 Graph View (NEW)

#### FR-GRF-001: Relationship Visualization
- Nodes: Source Connections, Catalog Entries, Labels
- Edges: Entry-to-Source, Entry-to-Label relationships
- Layout: Force-directed or hierarchical

#### FR-GRF-002: Interactive Navigation
- Zoom in/out with mouse wheel
- Pan with click-drag
- Click node to show details panel
- Double-click to focus/expand

#### FR-GRF-003: Filtering in Graph
- Filter by source type
- Filter by label
- Search for specific node

---

### 1.7 Settings (NEW)

#### FR-SET-001: Appearance Settings
- Theme: Light / Dark / System
- Density: Compact / Default / Comfortable
- Language: English / French (future)

#### FR-SET-002: Default Preferences
- Default view mode (List/Grid/Table)
- Default page size (25/50/100)
- Default export format

#### FR-SET-003: API Configuration
- Display current API endpoint
- Health check status indicator

---

### 1.8 Import/Export

#### FR-IMP-001: CSV Import
- Drag-and-drop file upload
- Preview data before import
- Column mapping interface
- Conflict resolution: Skip / Overwrite / Create New

#### FR-IMP-002: Bulk Import Progress
- Progress bar with percentage
- Show success/error count
- Detailed error log for failed rows

#### FR-EXP-001: Multiple Export Formats
- CSV (current)
- JSON (structured)
- XLSX (Excel with formatting)

---

## 2. Non-Functional Requirements

### 2.1 Performance

#### NFR-PERF-001: Page Load
- Initial load < 2 seconds on 4G connection
- Time to Interactive < 3 seconds

#### NFR-PERF-002: Interaction Responsiveness
- UI response to user action < 100ms
- Search results appear < 300ms after typing stops

#### NFR-PERF-003: Large Dataset Handling
- Render 10,000 entries without lag
- Filter 10,000 entries in < 500ms

### 2.2 Reliability

#### NFR-REL-001: Error Handling
- Graceful degradation on API errors
- Retry mechanism for failed requests (3 attempts)
- User-friendly error messages

#### NFR-REL-002: Data Integrity
- Optimistic updates with rollback on failure
- Confirmation for destructive actions
- Prevent duplicate submissions

### 2.3 Security

#### NFR-SEC-001: Authentication
- JWT token-based authentication
- Token refresh before expiry
- Automatic logout on token expiry

#### NFR-SEC-002: Authorization
- Role-based access (Admin, Editor, Viewer)
- UI elements hidden/disabled based on role

### 2.4 Usability

#### NFR-USE-001: Keyboard Navigation
- Tab navigation through all interactive elements
- Enter to activate buttons/links
- Escape to close modals
- Shortcuts: Ctrl+N (new), Ctrl+F (search), Del (delete)

#### NFR-USE-002: Responsive Design
- Minimum supported width: 1024px
- Optimal experience: 1280px - 1920px
- Tablet support (landscape)

### 2.5 Maintainability

#### NFR-MAINT-001: Code Organization
- Feature-based module structure
- Shared components in dedicated library
- Services separated from components

#### NFR-MAINT-002: Documentation
- JSDoc comments for public APIs
- README for each major module
- Storybook for component documentation

---

## 3. User Stories

### Epic: Dashboard
- US-001: As a user, I want to see an overview of my data catalog so I can quickly understand its current state.
- US-002: As a user, I want to see recent activity so I can track changes made by my team.
- US-003: As a user, I want quick action buttons so I can perform common tasks faster.

### Epic: Asset Dictionaries
- US-040: As a user, I want to create asset dictionaries so I can organize my catalog entries hierarchically.
- US-041: As a user, I want to use templates when creating dictionaries so I can start with a predefined structure.
- US-042: As a user, I want to add, edit, and delete nodes in the tree so I can customize the hierarchy.
- US-043: As a user, I want to drag and drop nodes so I can reorganize the structure easily.
- US-044: As a user, I want to assign catalog entries to nodes so I can categorize my data assets.
- US-045: As a user, I want to see a visual count of entries per node so I can understand the distribution.

### Epic: Explorer
- US-010: As a user, I want to switch between view modes so I can see data in my preferred format.
- US-011: As a user, I want to filter entries by multiple criteria so I can find specific data quickly.
- US-012: As a user, I want to save my filters so I can reuse them later.
- US-013: As a user, I want to edit entries inline so I can make quick changes without opening a modal.
- US-014: As a user, I want to select multiple entries so I can perform bulk operations.
- US-015: As a user, I want to export data in different formats so I can use it in other tools.

### Epic: Relationships
- US-020: As a user, I want to visualize relationships between sources, entries, and labels so I can understand data dependencies.
- US-021: As a user, I want to navigate the graph interactively so I can explore connections.

### Epic: Settings
- US-030: As a user, I want to customize the UI appearance so it matches my preferences.
- US-031: As a user, I want my preferences to persist across sessions.

---

## 4. Acceptance Criteria Template

Each user story should define acceptance criteria following this format:

```
GIVEN [context]
WHEN [action]
THEN [expected result]
```

Example for US-010:
```
GIVEN I am on the Explorer page
WHEN I click the "Table View" toggle button
THEN the entries are displayed in a table format
AND my view preference is saved to localStorage
AND subsequent visits default to Table View
```

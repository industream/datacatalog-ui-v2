# DataCatalog UI V2 - Implementation Plan

## Phase Overview

| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|--------------|
| Phase 0 | Project Setup | 1 day | Angular project, tooling, CI/CD |
| Phase 1 | Core Infrastructure | 3 days | Layout, routing, state, API layer |
| Phase 2 | Dashboard | 2 days | Stats, charts, activity feed |
| Phase 3 | Explorer - Basic | 3 days | Grid/List/Table views, search |
| Phase 4 | Explorer - Advanced | 3 days | Virtual scroll, filters, bulk ops |
| Phase 5 | Sources & Labels | 2 days | CRUD, forms, validation |
| Phase 6 | Graph View | 2 days | Relationship visualization |
| Phase 7 | Settings & Polish | 2 days | Preferences, themes, a11y |
| Phase 8 | Testing & Docs | 2 days | Tests, documentation, cleanup |

**Total Estimated: ~20 days**

---

## Phase 0: Project Setup

### Tasks

- [ ] **P0-001**: Initialize Angular 19 project with Vite
  ```bash
  npx @angular/cli@19 new datacatalog-ui --style=scss --routing=true --ssr=false
  ```

- [ ] **P0-002**: Install dependencies
  ```bash
  npm install @carbon/web-components @carbon/styles @carbon/charts
  npm install @angular/cdk lodash-es
  npm install -D @types/lodash-es
  ```

- [ ] **P0-003**: Configure TypeScript strict mode
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true
    }
  }
  ```

- [ ] **P0-004**: Setup ESLint + Prettier
  ```bash
  ng add @angular-eslint/schematics
  npm install -D prettier eslint-config-prettier
  ```

- [ ] **P0-005**: Configure Carbon Design System
  - Import Carbon styles in styles.scss
  - Setup custom properties for theming
  - Configure CUSTOM_ELEMENTS_SCHEMA

- [ ] **P0-006**: Setup project structure
  - Create folder structure as per architecture.md
  - Add path aliases in tsconfig.json

- [ ] **P0-007**: Create Dockerfile
  - Multi-stage build
  - Nginx for serving
  - Environment variable injection

- [ ] **P0-008**: Setup Git hooks
  - Pre-commit: lint, format, type-check
  - Commit message validation

### Acceptance Criteria
- Project builds without errors
- ESLint passes with zero warnings
- Docker image builds successfully
- Git hooks working

---

## Phase 1: Core Infrastructure

### Tasks

- [ ] **P1-001**: Create layout components
  - Header with navigation
  - Sidebar (collapsible)
  - Main content area
  - Footer (optional)

- [ ] **P1-002**: Implement routing
  - Lazy-loaded feature routes
  - Route guards for auth
  - Title service integration

- [ ] **P1-003**: Create API service layer
  - Base ApiService with error handling
  - HTTP interceptors (auth, error)
  - Request/response logging (dev only)

- [ ] **P1-004**: Setup state management
  - UIStore (theme, density, sidebar)
  - CatalogStore (entries, loading, error)
  - SourceStore, LabelStore
  - Persistence to localStorage

- [ ] **P1-005**: Create shared components (basic)
  - NotificationComponent (toast)
  - LoadingSkeletonComponent
  - EmptyStateComponent

- [ ] **P1-006**: Setup theming system
  - Light/Dark mode toggle
  - CSS custom properties
  - Density modes

- [ ] **P1-007**: Create config service
  - Load config.json at startup
  - Environment-based configuration

### Acceptance Criteria
- Navigation between all routes works
- Theme toggle persists across sessions
- API calls include auth token
- Loading states display correctly

---

## Phase 2: Dashboard

### Tasks

- [ ] **P2-001**: Create DashboardComponent
  - Grid layout for widgets
  - Responsive design

- [ ] **P2-002**: Implement StatsCard component
  - Display count with icon
  - Trend indicator (up/down/stable)
  - Click to navigate

- [ ] **P2-003**: Integrate CatalogStore stats
  - Total entries count
  - Entries by source type
  - Real-time updates

- [ ] **P2-004**: Implement DistributionChart
  - Carbon Charts donut chart
  - Interactive segments
  - Legend with counts

- [ ] **P2-005**: Implement ActivityFeed
  - Recent actions list
  - Relative timestamps
  - Action type icons

- [ ] **P2-006**: Implement QuickActions
  - New Entry, New Source buttons
  - Import/Export buttons
  - Keyboard shortcut hints

### Acceptance Criteria
- Dashboard loads in < 2 seconds
- Stats update when data changes
- Chart segments are clickable
- Quick actions open correct modals

---

## Phase 3: Explorer - Basic Views

### Tasks

- [ ] **P3-001**: Create ExplorerComponent
  - View mode toggle (List/Grid/Table/Graph)
  - Toolbar with search and filters
  - Content area with selected view

- [ ] **P3-002**: Implement GridView
  - Card-based layout
  - Entry card with key info
  - Selection checkbox
  - Edit/Delete actions

- [ ] **P3-003**: Implement ListView
  - Compact row layout
  - Essential info only
  - Faster for scanning

- [ ] **P3-004**: Implement TableView (basic)
  - Column headers
  - Sortable columns
  - Row selection

- [ ] **P3-005**: Implement search
  - Debounced input (300ms)
  - Search across multiple fields
  - Highlight matching text

- [ ] **P3-006**: Create EntryModal
  - Create/Edit mode
  - Form validation
  - Source connection selector
  - Metadata editor

- [ ] **P3-007**: Implement CRUD operations
  - Create entry
  - Update entry
  - Delete entry (with confirmation)
  - Optimistic updates

### Acceptance Criteria
- All three views display correctly
- Search filters results in real-time
- Create/Edit modal works
- Delete shows confirmation

---

## Phase 4: Explorer - Advanced Features

### Tasks

- [ ] **P4-001**: Implement virtual scrolling
  - CDK Virtual Scroll
  - Handle 10,000+ entries
  - Maintain smooth 60fps

- [ ] **P4-002**: Implement FilterPanel
  - Source Type filter (multi-select)
  - Labels filter (multi-select)
  - Data Type filter
  - Clear all filters

- [ ] **P4-003**: Implement saved filters
  - Save current filter as preset
  - Load preset
  - Delete preset

- [ ] **P4-004**: Implement BulkActionBar
  - Appears when items selected
  - Delete selected
  - Add/Remove labels
  - Export selected

- [ ] **P4-005**: Implement inline editing (Table)
  - Double-click to edit
  - Auto-save on blur
  - Undo support

- [ ] **P4-006**: Implement column customization
  - Show/hide columns
  - Reorder columns (drag-drop)
  - Persist preferences

- [ ] **P4-007**: Implement sorting
  - Click to sort
  - Multi-column sort
  - Sort indicators

- [ ] **P4-008**: Implement export
  - CSV format
  - JSON format
  - XLSX format (with xlsx library)
  - Export options dialog

### Acceptance Criteria
- 10,000 entries scroll smoothly
- Filters work correctly
- Bulk operations work
- Export produces valid files

---

## Phase 5: Sources & Labels

### Tasks

- [ ] **P5-001**: Create SourcesComponent
  - Grid of source cards
  - Search/filter
  - Add new source button

- [ ] **P5-002**: Implement SourceCard
  - Source type icon
  - Connection name
  - Entry count badge
  - Edit/Delete actions

- [ ] **P5-003**: Implement SourceModal
  - Dynamic form based on type
  - Default fields per type
  - Credential masking
  - Validation

- [ ] **P5-004**: Implement connection testing
  - Test button in modal
  - Show success/error
  - Timeout handling

- [ ] **P5-005**: Create LabelsComponent
  - Grid of label cards
  - Search
  - Add new label button

- [ ] **P5-006**: Implement LabelCard
  - Label name with color
  - Entry count badge
  - Edit/Delete actions

- [ ] **P5-007**: Implement LabelModal
  - Name input
  - Color picker
  - Icon selector (optional)
  - Duplicate validation

### Acceptance Criteria
- All source types have correct forms
- Sensitive fields are masked
- Labels can be colored
- Delete warns about dependencies

---

## Phase 6: Graph View

### Tasks

- [ ] **P6-001**: Integrate D3.js or Cytoscape.js
  - Choose library based on features
  - Setup in Angular

- [ ] **P6-002**: Implement GraphView component
  - Canvas/SVG container
  - Zoom controls
  - Pan controls

- [ ] **P6-003**: Create node types
  - Source node (large, colored by type)
  - Entry node (medium)
  - Label node (small, colored)

- [ ] **P6-004**: Create edge types
  - Entry-to-Source (solid line)
  - Entry-to-Label (dashed line)

- [ ] **P6-005**: Implement layout algorithm
  - Force-directed layout
  - Hierarchical option
  - Clustering by source

- [ ] **P6-006**: Implement interactivity
  - Click node to select
  - Hover for tooltip
  - Double-click to focus
  - Drag nodes

- [ ] **P6-007**: Implement filtering in graph
  - Filter by source type
  - Filter by label
  - Search for node

### Acceptance Criteria
- Graph renders correctly
- Nodes are interactive
- Performance OK with 500+ nodes
- Filtering works

---

## Phase 7: Settings & Polish

### Tasks

- [ ] **P7-001**: Create SettingsComponent
  - Sidebar navigation
  - Content area

- [ ] **P7-002**: Implement AppearanceSettings
  - Theme toggle
  - Density slider
  - Preview

- [ ] **P7-003**: Implement PreferencesSettings
  - Default view mode
  - Default page size
  - Default export format

- [ ] **P7-004**: Implement APISettings
  - Current API URL
  - Health check status
  - Connection test

- [ ] **P7-005**: Implement keyboard shortcuts
  - Ctrl+N: New entry
  - Ctrl+F: Focus search
  - Del: Delete selected
  - Escape: Close modal

- [ ] **P7-006**: Accessibility audit
  - Keyboard navigation
  - Screen reader testing
  - Color contrast
  - Focus management

- [ ] **P7-007**: Performance optimization
  - Bundle analysis
  - Lazy loading audit
  - Image optimization

- [ ] **P7-008**: Error handling polish
  - Error boundaries
  - Retry mechanisms
  - User-friendly messages

### Acceptance Criteria
- Settings persist correctly
- All shortcuts work
- Lighthouse a11y > 90
- Bundle size < 500KB gzipped

---

## Phase 8: Testing & Documentation

### Tasks

- [ ] **P8-001**: Write unit tests
  - Services: 90% coverage
  - Stores: 90% coverage
  - Pipes: 100% coverage

- [ ] **P8-002**: Write component tests
  - Shared components: 80% coverage
  - Feature components: critical paths

- [ ] **P8-003**: Write E2E tests
  - Login flow
  - CRUD operations
  - Bulk operations
  - Export

- [ ] **P8-004**: Create README
  - Project overview
  - Setup instructions
  - Development guide
  - Deployment guide

- [ ] **P8-005**: Create component documentation
  - Input/Output documentation
  - Usage examples
  - Storybook (optional)

- [ ] **P8-006**: Code cleanup
  - Remove unused code
  - Fix all TODOs
  - Consistent formatting

- [ ] **P8-007**: Final review
  - Cross-browser testing
  - Performance testing
  - Security review

### Acceptance Criteria
- All tests pass
- Coverage meets targets
- Documentation complete
- No critical issues

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance with large datasets | Early virtual scrolling implementation |
| Graph view complexity | Consider simpler alternative if needed |
| API compatibility | Create adapter layer |
| Carbon components limitations | Custom components as fallback |
| Timeline overrun | Prioritize core features, defer nice-to-haves |

---

## Definition of Done

A task is considered done when:

1. Code is written and compiles
2. Unit tests pass
3. No ESLint warnings
4. Code reviewed (self or peer)
5. Functionality works as specified
6. No regressions introduced
7. Documentation updated if needed

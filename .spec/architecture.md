# DataCatalog UI V2 - Architecture Specification

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           Angular Components                             ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      ││
│  │  │Dashboard │ │ Explorer │ │  Sources │ │  Labels  │ │ Settings │      ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          Shared Components                               ││
│  │  DataTable │ EntityCard │ FilterPanel │ Modal │ Notification │ Graph    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                               STATE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Store (Signals + RxJS)                           ││
│  │  CatalogStore │ SourceStore │ LabelStore │ UIStore │ AuthStore          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                              SERVICE LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                            API Services                                  ││
│  │  CatalogService │ SourceService │ LabelService │ ExportService          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Infrastructure Services                          ││
│  │  HttpClient │ AuthInterceptor │ ErrorHandler │ CacheService             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SYSTEMS                                │
│  ┌───────────────────────┐  ┌───────────────────────┐                       │
│  │   DataCatalog API     │  │   Keycloak (Auth)     │                       │
│  └───────────────────────┘  └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Project Structure

```
/src
├── /app
│   ├── /core                      # Singleton services, guards, interceptors
│   │   ├── /auth
│   │   │   ├── auth.guard.ts
│   │   │   ├── auth.interceptor.ts
│   │   │   └── auth.service.ts
│   │   ├── /http
│   │   │   ├── api.service.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── cache.service.ts
│   │   └── /config
│   │       ├── app.config.ts
│   │       └── environment.ts
│   │
│   ├── /shared                    # Shared components, directives, pipes
│   │   ├── /components
│   │   │   ├── /data-table
│   │   │   ├── /entity-card
│   │   │   ├── /filter-panel
│   │   │   ├── /modal
│   │   │   ├── /notification
│   │   │   ├── /loading-skeleton
│   │   │   ├── /empty-state
│   │   │   ├── /confirmation-dialog
│   │   │   └── /bulk-action-bar
│   │   ├── /directives
│   │   │   ├── click-outside.directive.ts
│   │   │   ├── infinite-scroll.directive.ts
│   │   │   └── keyboard-shortcut.directive.ts
│   │   ├── /pipes
│   │   │   ├── highlight.pipe.ts
│   │   │   ├── relative-time.pipe.ts
│   │   │   ├── truncate.pipe.ts
│   │   │   └── object-value.pipe.ts
│   │   └── /models
│   │       ├── catalog-entry.model.ts
│   │       ├── source-connection.model.ts
│   │       ├── label.model.ts
│   │       └── api-response.model.ts
│   │
│   ├── /features                  # Feature modules (lazy-loaded)
│   │   ├── /dashboard
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.component.html
│   │   │   ├── dashboard.component.scss
│   │   │   ├── /components
│   │   │   │   ├── stats-card/
│   │   │   │   ├── distribution-chart/
│   │   │   │   ├── activity-feed/
│   │   │   │   └── quick-actions/
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   ├── /explorer
│   │   │   ├── explorer.component.ts
│   │   │   ├── /components
│   │   │   │   ├── list-view/
│   │   │   │   ├── grid-view/
│   │   │   │   ├── table-view/
│   │   │   │   ├── graph-view/
│   │   │   │   ├── entry-modal/
│   │   │   │   └── import-modal/
│   │   │   ├── /store
│   │   │   │   └── explorer.store.ts
│   │   │   └── explorer.routes.ts
│   │   │
│   │   ├── /sources
│   │   │   ├── sources.component.ts
│   │   │   ├── /components
│   │   │   │   ├── source-card/
│   │   │   │   ├── source-modal/
│   │   │   │   └── source-form/
│   │   │   └── sources.routes.ts
│   │   │
│   │   ├── /labels
│   │   │   ├── labels.component.ts
│   │   │   ├── /components
│   │   │   │   ├── label-card/
│   │   │   │   └── label-modal/
│   │   │   └── labels.routes.ts
│   │   │
│   │   └── /settings
│   │       ├── settings.component.ts
│   │       ├── /components
│   │       │   ├── appearance-settings/
│   │       │   ├── preferences-settings/
│   │       │   └── api-settings/
│   │       └── settings.routes.ts
│   │
│   ├── /store                     # Global state management
│   │   ├── catalog.store.ts
│   │   ├── source.store.ts
│   │   ├── label.store.ts
│   │   ├── ui.store.ts
│   │   └── index.ts
│   │
│   ├── /layout                    # App shell components
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── footer/
│   │
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.config.ts
│   └── app.routes.ts
│
├── /assets
│   ├── /config
│   │   └── config.json
│   ├── /icons
│   └── /i18n
│
├── /styles
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _typography.scss
│   ├── _animations.scss
│   └── _carbon-overrides.scss
│
├── index.html
├── main.ts
└── styles.scss
```

## 3. Component Architecture

### 3.1 Smart vs Presentational Components

**Smart Components (Containers)**
- Connect to stores/services
- Handle business logic
- Pass data to presentational components
- Located in feature modules

**Presentational Components (Dumb)**
- Receive data via @Input()
- Emit events via @Output()
- No direct service injection
- Located in shared module

### 3.2 Component Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                      ExplorerComponent (Smart)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   FilterPanel   │  │   ViewToggle    │  │  BulkActionBar  │ │
│  │  (Presentational)│  │ (Presentational)│  │ (Presentational)│ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Content Area                            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │  │
│  │  │  ListView  │ │  GridView  │ │ TableView  │ (one active)│  │
│  │  └────────────┘ └────────────┘ └────────────┘            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow

```
User Action → Component → Store Action → Service → API
                                              ↓
UI Update ← Component ← Store State ← Service Response
```

## 4. State Management

### 4.1 Store Pattern with Signals

```typescript
// Example: catalog.store.ts
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  // State
  private readonly _entries = signal<CatalogEntry[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<FilterState>(defaultFilters);

  // Selectors (computed)
  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly filteredEntries = computed(() => {
    const entries = this._entries();
    const filters = this._filters();
    return this.applyFilters(entries, filters);
  });

  readonly stats = computed(() => ({
    total: this._entries().length,
    byType: this.groupByType(this._entries())
  }));

  // Actions
  async loadEntries(): Promise<void> {
    this._loading.set(true);
    try {
      const entries = await this.catalogService.getAll();
      this._entries.set(entries);
      this._error.set(null);
    } catch (e) {
      this._error.set(e.message);
    } finally {
      this._loading.set(false);
    }
  }

  setFilters(filters: Partial<FilterState>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }
}
```

### 4.2 UI Store

```typescript
@Injectable({ providedIn: 'root' })
export class UIStore {
  // Persisted to localStorage
  private readonly _theme = signal<'light' | 'dark'>('dark');
  private readonly _density = signal<'compact' | 'default' | 'comfortable'>('default');
  private readonly _viewMode = signal<'list' | 'grid' | 'table' | 'graph'>('grid');
  private readonly _sidebarOpen = signal<boolean>(true);

  // Computed
  readonly themeClass = computed(() => `theme-${this._theme()}`);
  readonly densityClass = computed(() => `density-${this._density()}`);

  constructor() {
    this.loadFromStorage();
    effect(() => this.saveToStorage());
  }
}
```

## 5. Routing Architecture

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Dashboard - DataCatalog'
  },
  {
    path: 'explorer',
    loadComponent: () => import('./features/explorer/explorer.component')
      .then(m => m.ExplorerComponent),
    title: 'Explorer - DataCatalog'
  },
  {
    path: 'sources',
    loadComponent: () => import('./features/sources/sources.component')
      .then(m => m.SourcesComponent),
    title: 'Sources - DataCatalog'
  },
  {
    path: 'labels',
    loadComponent: () => import('./features/labels/labels.component')
      .then(m => m.LabelsComponent),
    title: 'Labels - DataCatalog'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component')
      .then(m => m.SettingsComponent),
    title: 'Settings - DataCatalog'
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

## 6. API Integration

### 6.1 Base API Service

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = inject(ConfigService).apiUrl;
  private readonly http = inject(HttpClient);

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params }).pipe(
      retry({ count: 3, delay: 1000 }),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      catchError(this.handleError)
    );
  }

  // PUT, PATCH, DELETE...

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || 'An error occurred';
    return throwError(() => new Error(message));
  }
}
```

### 6.2 Feature Services

```typescript
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

  getAll(signal?: AbortSignal): Promise<CatalogEntry[]> {
    return firstValueFrom(
      this.api.get<{ items: CatalogEntry[] }>('/catalog-entries')
    ).then(res => res.items);
  }

  getById(id: string): Promise<CatalogEntry> {
    return firstValueFrom(this.api.get<CatalogEntry>(`/catalog-entries/${id}`));
  }

  create(entry: CreateCatalogEntryDto): Promise<CatalogEntry> {
    return firstValueFrom(this.api.post<CatalogEntry>('/catalog-entries', entry));
  }

  // update, delete, import, export...
}
```

## 7. Performance Optimizations

### 7.1 Virtual Scrolling

```typescript
// Using Angular CDK Virtual Scroll
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="72" class="viewport">
      <div *cdkVirtualFor="let entry of entries; trackBy: trackById"
           class="entry-row">
        <app-entry-row [entry]="entry" />
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class TableViewComponent {
  trackById = (index: number, entry: CatalogEntry) => entry.id;
}
```

### 7.2 Change Detection Strategy

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class EntryCardComponent {
  @Input({ required: true }) entry!: CatalogEntry;
}
```

### 7.3 Lazy Loading

- All feature modules lazy-loaded
- Images lazy-loaded with `loading="lazy"`
- Defer heavy components with `@defer`

```typescript
@Component({
  template: `
    @defer (on viewport) {
      <app-distribution-chart [data]="chartData()" />
    } @placeholder {
      <app-chart-skeleton />
    }
  `
})
```

## 8. Security Architecture

### 8.1 Authentication Flow

```
┌────────┐     ┌────────────┐     ┌──────────┐
│  User  │────▶│  Keycloak  │────▶│   App    │
└────────┘     └────────────┘     └──────────┘
     │              │                   │
     │   1. Login   │                   │
     │─────────────▶│                   │
     │              │                   │
     │   2. Token   │                   │
     │◀─────────────│                   │
     │              │                   │
     │   3. Access App with Token       │
     │──────────────────────────────────▶
     │              │                   │
     │              │   4. Validate     │
     │              │◀──────────────────│
     │              │                   │
     │              │   5. OK           │
     │              │──────────────────▶│
```

### 8.2 HTTP Interceptor

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token && !req.url.includes('/public/')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
```

## 9. Testing Strategy

### 9.1 Unit Tests

- **Services**: Mock HTTP calls, test business logic
- **Stores**: Test state transitions, computed values
- **Pipes**: Test transformations with various inputs
- **Components**: Test with Testing Library, mock dependencies

### 9.2 Integration Tests

- Test feature modules with real store
- Test routing and navigation
- Test form validation flows

### 9.3 E2E Tests

- Critical user journeys with Playwright
- Visual regression with Percy/Chromatic

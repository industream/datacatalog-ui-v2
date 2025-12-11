import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Dashboard - DataCatalog'
  },
  {
    path: 'catalog-entries',
    loadComponent: () => import('./features/catalog-entries/catalog-entries.component')
      .then(m => m.CatalogEntriesComponent),
    title: 'Catalog Entries - DataCatalog'
  },
  {
    path: 'asset-dictionaries',
    loadComponent: () => import('./features/assets/assets.component')
      .then(m => m.AssetsComponent),
    title: 'Asset Dictionaries - DataCatalog'
  },
  {
    path: 'asset-dictionaries/:id',
    loadComponent: () => import('./features/assets/asset-editor.component')
      .then(m => m.AssetEditorComponent),
    title: 'Asset Editor - DataCatalog'
  },
  {
    path: 'source-connections',
    loadComponent: () => import('./features/sources/sources.component')
      .then(m => m.SourcesComponent),
    title: 'Source Connection - DataCatalog'
  },
  {
    path: 'labels',
    loadComponent: () => import('./features/labels/labels.component')
      .then(m => m.LabelsComponent),
    title: 'Labels - DataCatalog'
  },
  {
    path: 'source-types',
    loadComponent: () => import('./features/source-types/source-types.component')
      .then(m => m.SourceTypesComponent),
    title: 'Source Types - DataCatalog'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component')
      .then(m => m.SettingsComponent),
    title: 'Settings - DataCatalog'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

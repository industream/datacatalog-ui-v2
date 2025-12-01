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
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

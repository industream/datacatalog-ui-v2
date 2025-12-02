import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import '@carbon/web-components/es/components/ui-shell/index.js';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cds-header aria-label="DataCatalog" role="banner">
      <cds-header-name href="javascript:void(0)" prefix="">
        <a class="header-logo" routerLink="/dashboard">
          <img src="assets/Industream.DataCatalog.Dark.Logo.svg" alt="DataCatalog" />
          <span class="app-name">DataCatalog</span>
        </a>
      </cds-header-name>

      <!-- Side Navigation Rail -->
      <div class="side-nav-rail">
        @for (item of navItems; track item.path) {
          <a class="nav-link"
             [routerLink]="item.path"
             routerLinkActive="active"
             [title]="item.label">
            <span class="material-symbols-outlined">{{ item.icon }}</span>
          </a>
        }
      </div>

      <!-- Global Actions on the right -->
      <div class="cds--header__global">
        <cds-header-global-action
          aria-label="Toggle theme"
          [tooltip-text]="isDarkTheme() ? 'Switch to light mode' : 'Switch to dark mode'"
          tooltip-position="bottom"
          (click)="toggleTheme()">
          <span class="material-symbols-outlined header-icon">{{ isDarkTheme() ? 'dark_mode' : 'light_mode' }}</span>
        </cds-header-global-action>

        <cds-header-global-action
          aria-label="Settings"
          tooltip-text="Settings"
          tooltip-position="bottom"
          routerLink="/settings">
          <span class="material-symbols-outlined header-icon">settings</span>
        </cds-header-global-action>
      </div>
    </cds-header>
  `,
  styles: [`
    :host {
      display: block;
    }

    cds-header {
      --cds-header-height: 48px;
      --cds-background: var(--dc-bg-secondary);
      --cds-layer-01: var(--dc-bg-secondary);
      --cds-border-subtle: var(--dc-border-subtle);
      --cds-text-primary: var(--dc-text-primary);
      --cds-text-secondary: var(--dc-text-secondary);
      --cds-icon-primary: var(--dc-text-primary);
      background: var(--dc-bg-secondary) !important;
      border-bottom: 1px solid var(--dc-border-subtle);
    }

    cds-header::part(header) {
      background: var(--dc-bg-secondary);
    }

    cds-header-global-action {
      --cds-icon-primary: var(--dc-text-primary);
      --cds-background-hover: var(--dc-bg-tertiary);
    }

    cds-header-name {
      padding: 0;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1rem;
      height: 100%;
      text-decoration: none;
      color: var(--dc-text-primary);

      img {
        height: 32px;
        width: auto;
      }

      .app-name {
        font-weight: 500;
        font-size: 1rem;
        margin-top: 2px;
      }
    }

    /* Side Navigation Rail - positioned left */
    .side-nav-rail {
      position: fixed;
      top: 48px;
      left: 0;
      width: 4rem;
      height: calc(100vh - 48px);
      background: var(--dc-bg-secondary);
      border-right: 1px solid var(--dc-border-subtle);
      display: flex;
      flex-direction: column;
      padding-top: 1rem;
      z-index: 100;
    }

    .nav-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 3rem;
      color: var(--dc-text-secondary);
      text-decoration: none;
      transition: all var(--dc-duration-fast);
      position: relative;

      &:hover {
        color: var(--dc-text-primary);
        background: var(--dc-bg-tertiary);
      }

      &.active {
        color: var(--dc-primary);
        background: color-mix(in srgb, var(--dc-primary) 10%, transparent);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--dc-primary);
        }
      }

      .material-symbols-outlined {
        font-size: 22px;
      }
    }

    .header-icon {
      font-size: 20px;
      padding: 0.75rem;
      color: var(--dc-text-primary);
    }
  `]
})
export class HeaderComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/explorer', label: 'Explorer', icon: 'folder_open' },
    { path: '/assets', label: 'Asset Dictionaries', icon: 'account_tree' },
    { path: '/sources', label: 'Sources', icon: 'cable' },
    { path: '/labels', label: 'Labels', icon: 'label' }
  ];

  readonly isDarkTheme = signal(true);

  constructor() {
    this.loadThemePreference();
  }

  toggleTheme(): void {
    this.isDarkTheme.update(dark => !dark);
    this.applyTheme();
    this.saveThemePreference();
  }

  private loadThemePreference(): void {
    const saved = localStorage.getItem('dc-theme');
    if (saved) {
      this.isDarkTheme.set(saved === 'dark');
    }
    this.applyTheme();
  }

  private saveThemePreference(): void {
    localStorage.setItem('dc-theme', this.isDarkTheme() ? 'dark' : 'light');
  }

  private applyTheme(): void {
    document.documentElement.setAttribute(
      'data-theme',
      this.isDarkTheme() ? 'dark' : 'light'
    );
  }
}

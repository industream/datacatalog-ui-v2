import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
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
    <cds-header aria-label="DataCatalog">
      <cds-header-menu-button
        button-label-active="Close menu"
        button-label-inactive="Open menu"
        (click)="toggleSidebar()">
      </cds-header-menu-button>

      <cds-header-name href="/" prefix="Industream">
        DataCatalog
      </cds-header-name>

      <cds-header-nav menu-bar-label="Navigation">
        @for (item of navItems; track item.path) {
          <cds-header-nav-item
            [routerLink]="item.path"
            routerLinkActive="active">
            <span class="material-symbols-outlined nav-icon">{{ item.icon }}</span>
            {{ item.label }}
          </cds-header-nav-item>
        }
      </cds-header-nav>

      <cds-header-global-bar>
        <cds-header-global-action
          aria-label="Search"
          tooltip-text="Search"
          (click)="openSearch()">
          <span class="material-symbols-outlined">search</span>
        </cds-header-global-action>

        <cds-header-global-action
          aria-label="Toggle theme"
          [tooltip-text]="isDarkTheme() ? 'Switch to light mode' : 'Switch to dark mode'"
          (click)="toggleTheme()">
          <span class="material-symbols-outlined">
            {{ isDarkTheme() ? 'light_mode' : 'dark_mode' }}
          </span>
        </cds-header-global-action>

        <cds-header-global-action
          aria-label="Settings"
          tooltip-text="Settings"
          routerLink="/settings">
          <span class="material-symbols-outlined">settings</span>
        </cds-header-global-action>
      </cds-header-global-bar>
    </cds-header>
  `,
  styles: [`
    :host {
      display: block;
    }

    cds-header {
      --cds-header-height: 48px;
    }

    cds-header-nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-icon {
      font-size: 18px;
    }

    cds-header-nav-item.active {
      border-bottom: 2px solid var(--dc-primary);
    }

    cds-header-global-action .material-symbols-outlined {
      font-size: 20px;
    }
  `]
})
export class HeaderComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/explorer', label: 'Explorer', icon: 'folder_open' },
    { path: '/sources', label: 'Sources', icon: 'cable' },
    { path: '/labels', label: 'Labels', icon: 'label' }
  ];

  readonly isDarkTheme = signal(true);
  readonly sidebarOpen = signal(false);

  constructor() {
    this.loadThemePreference();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  toggleTheme(): void {
    this.isDarkTheme.update(dark => !dark);
    this.applyTheme();
    this.saveThemePreference();
  }

  openSearch(): void {
    // TODO: Implement global search
    console.log('Open search');
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

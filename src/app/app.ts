import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { ConfirmationDialogComponent } from './shared/components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ConfirmationDialogComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="app-container">
      <app-header />
      <main class="main-content">
        <router-outlet />
      </main>
      <app-confirmation-dialog />
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-top: 48px; /* Header height */
      margin-left: 4rem; /* Sidebar width */
      background: var(--dc-bg-primary);
    }
  `]
})
export class App implements OnInit {
  ngOnInit(): void {
    this.initializeTheme();
    this.initializeDensity();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('dc-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  private initializeDensity(): void {
    const savedDensity = localStorage.getItem('dc-density') || 'compact';
    document.documentElement.setAttribute('data-density', savedDensity);
  }
}

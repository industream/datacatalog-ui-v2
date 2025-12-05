import { Injectable, signal, OnDestroy } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface PollingConfig {
  enabled: boolean;
  intervalMs: number;
}

const DEFAULT_INTERVAL_MS = 30000; // 30 seconds
const STORAGE_KEY = 'dc-polling-config';

@Injectable({ providedIn: 'root' })
export class PollingService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private subscriptions = new Map<string, Subscription>();
  private callbacks = new Map<string, () => void>();

  readonly enabled = signal(true);
  readonly intervalMs = signal(DEFAULT_INTERVAL_MS);
  readonly lastRefresh = signal<Date | null>(null);

  constructor() {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAll();
  }

  /**
   * Register a polling callback for a specific key
   */
  register(key: string, callback: () => void): void {
    this.callbacks.set(key, callback);

    if (this.enabled()) {
      this.startPolling(key);
    }
  }

  /**
   * Unregister a polling callback
   */
  unregister(key: string): void {
    this.stopPolling(key);
    this.callbacks.delete(key);
  }

  /**
   * Start polling for a specific key
   */
  private startPolling(key: string): void {
    // Stop existing subscription if any
    this.stopPolling(key);

    const callback = this.callbacks.get(key);
    if (!callback) return;

    const subscription = interval(this.intervalMs())
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        callback();
        this.lastRefresh.set(new Date());
      });

    this.subscriptions.set(key, subscription);
  }

  /**
   * Stop polling for a specific key
   */
  private stopPolling(key: string): void {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Restart all polling with current config
   */
  restartAll(): void {
    this.stopAll();

    if (this.enabled()) {
      this.callbacks.forEach((_, key) => this.startPolling(key));
    }
  }

  /**
   * Manually trigger all callbacks (force refresh)
   */
  refreshNow(): void {
    this.callbacks.forEach(callback => callback());
    this.lastRefresh.set(new Date());
  }

  /**
   * Update polling configuration
   */
  setConfig(config: Partial<PollingConfig>): void {
    if (config.enabled !== undefined) {
      this.enabled.set(config.enabled);
    }
    if (config.intervalMs !== undefined) {
      this.intervalMs.set(config.intervalMs);
    }

    this.saveConfig();
    this.restartAll();
  }

  /**
   * Toggle polling on/off
   */
  toggle(): void {
    this.setConfig({ enabled: !this.enabled() });
  }

  /**
   * Load config from localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved) as PollingConfig;
        this.enabled.set(config.enabled ?? true);
        this.intervalMs.set(config.intervalMs ?? DEFAULT_INTERVAL_MS);
      }
    } catch {
      // Use defaults
    }
  }

  /**
   * Save config to localStorage
   */
  private saveConfig(): void {
    const config: PollingConfig = {
      enabled: this.enabled(),
      intervalMs: this.intervalMs()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

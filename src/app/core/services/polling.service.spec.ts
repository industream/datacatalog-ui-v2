import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { PollingService } from './polling.service';

describe('PollingService', () => {
  let service: PollingService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem']);
    localStorageSpy.getItem.and.returnValue(null);

    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);

    TestBed.configureTestingModule({
      providers: [PollingService]
    });

    service = TestBed.inject(PollingService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  describe('initial state', () => {
    it('should be enabled by default', () => {
      expect(service.enabled()).toBeTrue();
    });

    it('should have default interval of 30000ms', () => {
      expect(service.intervalMs()).toBe(30000);
    });

    it('should have null lastRefresh initially', () => {
      expect(service.lastRefresh()).toBeNull();
    });
  });

  describe('register/unregister', () => {
    it('should register callback', () => {
      const callback = jasmine.createSpy('callback');
      service.register('test-key', callback);

      // Callback shouldn't be called immediately
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unregister callback', () => {
      const callback = jasmine.createSpy('callback');
      service.register('test-key', callback);
      service.unregister('test-key');

      // Should not throw
      expect(() => service.refreshNow()).not.toThrow();
    });
  });

  describe('polling behavior', () => {
    it('should call registered callbacks on interval', fakeAsync(() => {
      const callback = jasmine.createSpy('callback');
      service.register('test-key', callback);

      // After one interval
      tick(30000);
      expect(callback).toHaveBeenCalledTimes(1);

      // After another interval
      tick(30000);
      expect(callback).toHaveBeenCalledTimes(2);

      discardPeriodicTasks();
    }));

    it('should not call callbacks when disabled', fakeAsync(() => {
      const callback = jasmine.createSpy('callback');
      service.setConfig({ enabled: false });
      service.register('test-key', callback);

      tick(60000);
      expect(callback).not.toHaveBeenCalled();

      discardPeriodicTasks();
    }));

    it('should stop polling for unregistered callbacks', fakeAsync(() => {
      const callback = jasmine.createSpy('callback');
      service.register('test-key', callback);

      tick(30000);
      expect(callback).toHaveBeenCalledTimes(1);

      service.unregister('test-key');

      tick(30000);
      expect(callback).toHaveBeenCalledTimes(1); // No additional calls

      discardPeriodicTasks();
    }));
  });

  describe('refreshNow', () => {
    it('should call all registered callbacks immediately', () => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      service.register('key1', callback1);
      service.register('key2', callback2);

      service.refreshNow();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should update lastRefresh timestamp', () => {
      const before = new Date();
      service.refreshNow();
      const after = new Date();

      const lastRefresh = service.lastRefresh();
      expect(lastRefresh).not.toBeNull();
      expect(lastRefresh!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastRefresh!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('toggle', () => {
    it('should toggle enabled state', () => {
      expect(service.enabled()).toBeTrue();

      service.toggle();
      expect(service.enabled()).toBeFalse();

      service.toggle();
      expect(service.enabled()).toBeTrue();
    });

    it('should persist toggle to localStorage', () => {
      service.toggle();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'dc-polling-config',
        jasmine.any(String)
      );
    });
  });

  describe('setConfig', () => {
    it('should update enabled state', () => {
      service.setConfig({ enabled: false });
      expect(service.enabled()).toBeFalse();
    });

    it('should update interval', () => {
      service.setConfig({ intervalMs: 60000 });
      expect(service.intervalMs()).toBe(60000);
    });

    it('should restart polling with new interval', fakeAsync(() => {
      const callback = jasmine.createSpy('callback');
      service.register('test-key', callback);

      service.setConfig({ intervalMs: 10000 });

      tick(10000);
      expect(callback).toHaveBeenCalledTimes(1);

      tick(10000);
      expect(callback).toHaveBeenCalledTimes(2);

      discardPeriodicTasks();
    }));

    it('should save config to localStorage', () => {
      service.setConfig({ enabled: false, intervalMs: 60000 });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'dc-polling-config',
        JSON.stringify({ enabled: false, intervalMs: 60000 })
      );
    });
  });

  describe('stopAll', () => {
    it('should stop all polling', fakeAsync(() => {
      const callback1 = jasmine.createSpy('callback1');
      const callback2 = jasmine.createSpy('callback2');

      service.register('key1', callback1);
      service.register('key2', callback2);

      service.stopAll();

      tick(60000);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      discardPeriodicTasks();
    }));
  });

  describe('localStorage integration', () => {
    it('should load config from localStorage on init', () => {
      localStorageSpy.getItem.and.returnValue(JSON.stringify({
        enabled: false,
        intervalMs: 45000
      }));

      const newService = new PollingService();

      expect(newService.enabled()).toBeFalse();
      expect(newService.intervalMs()).toBe(45000);

      newService.ngOnDestroy();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageSpy.getItem.and.returnValue('invalid json');

      const newService = new PollingService();

      // Should use defaults
      expect(newService.enabled()).toBeTrue();
      expect(newService.intervalMs()).toBe(30000);

      newService.ngOnDestroy();
    });
  });
});

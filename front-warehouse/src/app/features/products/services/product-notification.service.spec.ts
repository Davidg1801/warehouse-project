import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import * as signalR from '@microsoft/signalr';
import { firstValueFrom } from 'rxjs';
import { ProductDto } from '../dtos/product.dto';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ProductNotificationService, SIGNALR_BUILDER } from './product-notification.service';

describe('ProductNotificationService', () => {
  let service: ProductNotificationService;

  const mockRegisteredCallbacks = new Map<string, (arg?: unknown) => void>();

  const mockHubConnection = {
    state: signalR.HubConnectionState.Disconnected,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((eventName: string, callback: (arg?: unknown) => void) => {
      mockRegisteredCallbacks.set(eventName, callback);
    }),
  };

  const mockBuilderInstance = {
    withUrl: vi.fn().mockImplementation((_url, options) => {
      if (options?.accessTokenFactory) {
        options.accessTokenFactory();
      }
      return mockBuilderInstance;
    }),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(mockHubConnection),
  };

  const MockBuilderClass = vi.fn().mockImplementation(function () {
    return mockBuilderInstance;
  });
  const keycloakMock = { token: 'mock-access-token-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisteredCallbacks.clear();
    mockHubConnection.state = signalR.HubConnectionState.Disconnected;
    keycloakMock.token = 'mock-access-token-123';

    TestBed.configureTestingModule({
      providers: [
        ProductNotificationService,
        { provide: Keycloak, useValue: keycloakMock },
        { provide: SIGNALR_BUILDER, useValue: MockBuilderClass },
      ],
    });

    service = TestBed.inject(ProductNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start SignalR connection and register event handlers', () => {
    service.startConnection();

    expect(MockBuilderClass).toHaveBeenCalledTimes(1);
    expect(mockHubConnection.start).toHaveBeenCalledTimes(1);
    expect(mockHubConnection.on).toHaveBeenCalledWith('TopProductsUpdated', expect.any(Function));
    expect(mockHubConnection.on).toHaveBeenCalledWith('ProductUpdated', expect.any(Function));
    expect(mockHubConnection.on).toHaveBeenCalledWith('ProductDeleted', expect.any(Function));
  });

  it('should not start new connection if state is already connected', () => {
    service.startConnection();
    expect(mockHubConnection.start).toHaveBeenCalledTimes(1);

    mockHubConnection.state = signalR.HubConnectionState.Connected;
    service.startConnection();

    expect(mockHubConnection.start).toHaveBeenCalledTimes(1);
  });

  it('should emit product data through productUpdated$ when ProductUpdated event is triggered', async () => {
    const mockProduct: ProductDto = {
      uuid: '123-123',
      name: 'AMD Ryzen 9 9950X',
      categoryId: 1,
      price: 2999,
      quantity: 3,
    };

    const productPromise = firstValueFrom(service.productUpdated$);
    service.startConnection();

    const callback = mockRegisteredCallbacks.get('ProductUpdated');
    expect(callback).toBeDefined();
    callback?.(mockProduct);

    const product = await productPromise;
    expect(product).toEqual(mockProduct);
  });

  it('should emit product ID through productDeleted$ when ProductDeleted event is triggered', async () => {
    const deletedId = '123-123';
    const deletedPromise = firstValueFrom(service.productDeleted$);

    service.startConnection();

    const callback = mockRegisteredCallbacks.get('ProductDeleted');
    expect(callback).toBeDefined();
    callback?.(deletedId);

    const id = await deletedPromise;
    expect(id).toBe(deletedId);
  });

  it('should emit event through topProductsUpdated$ when TopProductsUpdated event is triggered', async () => {
    vi.useFakeTimers();
    try {
      const topUpdatedPromise = firstValueFrom(service.topProductsUpdated$);

      service.startConnection();

      const callback = mockRegisteredCallbacks.get('TopProductsUpdated');
      expect(callback).toBeDefined();
      callback?.();

      vi.advanceTimersByTime(500);

      await expect(topUpdatedPromise).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should call stop on hubConnection when stopConnection is invoked', () => {
    service.startConnection();
    service.stopConnection();

    expect(mockHubConnection.stop).toHaveBeenCalledTimes(1);
  });

  it('should throw an error during startConnection if Keycloak token is missing', () => {
    keycloakMock.token = '';

    expect(() => service.startConnection()).toThrow(
      '[Notification SignalR] There is no access token! Cannot open connection.',
    );
  });
});

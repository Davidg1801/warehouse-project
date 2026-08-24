import { inject, Injectable, InjectionToken } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import Keycloak from 'keycloak-js';
import { auditTime, Observable, Subject } from 'rxjs';
import { environment } from '@environments/environment.dev';
import { ProductDto } from '../dtos/product.dto';

export const SIGNALR_BUILDER = new InjectionToken<typeof signalR.HubConnectionBuilder>(
  'SIGNALR_BUILDER',
  {
    providedIn: 'root',
    factory: () => signalR.HubConnectionBuilder,
  },
);

@Injectable({
  providedIn: 'root',
})
export class ProductNotificationService {
  private readonly keycloak = inject(Keycloak);
  private hubConnection?: signalR.HubConnection;
  private readonly hubBuilder = inject(SIGNALR_BUILDER);

  // Seperate stream for each event from backend
  private topProductsUpdatedSubject = new Subject<void>();
  private productUpdatedSubject = new Subject<ProductDto>();
  private productDeletedSubject = new Subject<string>();

  public topProductsUpdated$: Observable<void> = this.topProductsUpdatedSubject
    .asObservable()
    .pipe(auditTime(500));
  public productUpdated$: Observable<ProductDto> = this.productUpdatedSubject.asObservable();
  public productDeleted$: Observable<string> = this.productDeletedSubject.asObservable();

  private wsUrl = environment.wsUrl;

  private getAccessToken(): string {
    const token = this.keycloak.token;
    if (!token) {
      throw new Error('[Notification SignalR] There is no access token! Cannot open connection.');
    }
    return token;
  }

  public startConnection(): void {
    if (
      this.hubConnection &&
      (this.hubConnection.state === signalR.HubConnectionState.Connected ||
        this.hubConnection.state === signalR.HubConnectionState.Connecting)
    ) {
      return;
    }

    const url = `${this.wsUrl}/websocket/products`;

    this.hubConnection = new this.hubBuilder()
      .withUrl(url, {
        accessTokenFactory: () => this.getAccessToken(),
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Error)
      .build();

    this.registerEventHandlers();

    // Start connection
    this.hubConnection
      .start()
      .then(() => {
        console.log('[Notification SignalR] Connection successful!');
      })
      .catch((err) => console.error('[Notification SignalR] No connection:', err));
  }

  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.off('TopProductsUpdated');
    this.hubConnection.off('ProductUpdated');
    this.hubConnection.off('ProductDeleted');

    // Event: Top Products Updated
    this.hubConnection.on('TopProductsUpdated', () => {
      console.log('[Notification SignalR] Event: Top product list has been updated!');
      this.topProductsUpdatedSubject.next();
    });

    // Event: Product Updated
    this.hubConnection.on('ProductUpdated', (response: ProductDto) => {
      console.log('[Notification SignalR] Event: Product has been updated!');
      this.productUpdatedSubject.next(response);
    });

    // Event: Product Deleted
    this.hubConnection.on('ProductDeleted', (response: string) => {
      console.log('[Notification SignalR] Event: Product has been deleted!');
      this.productDeletedSubject.next(response);
    });
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = undefined;
    }
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { OrdersService } from '@features/orders/services/orders.service';
import { OrderCartStore } from '@features/orders/stores/order-cart.store';
import { CreateOrderDto } from '@features/orders/dtos/create-order.dto';

@Component({
  selector: 'app-create-order.component',
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  providers: [OrderCartStore],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.scss',
})
export class CreateOrderComponent {
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);
  private readonly ordersService = inject(OrdersService);

  protected readonly store = inject(OrderCartStore);

  readonly userEmail = signal<string>(this.keycloak.tokenParsed?.['email'] ?? '');
  readonly userName = signal<string>(this.keycloak.tokenParsed?.['name'] ?? '');
  readonly userLogin = signal<string>(this.keycloak.tokenParsed?.['preferred_username'] ?? '');

  submitOrder(): void {
    const items = this.store.cartItems();
    if (items.length === 0 || this.store.isSubmitting() === true) return;

    this.store.isSubmitting.set(true);

    const dto: CreateOrderDto = {
      customerId: this.userLogin(),
      items: items.map((item) => ({
        productId: item.product.uuid,
        quantity: item.quantityToOrder,
      })),
    };

    this.ordersService.addOrder(dto).subscribe({
      next: () => {
        this.store.isSubmitting.set(false);
        this.store.clearCart();
      },
      error: (err) => {
        console.error('Failed to submit order: ', err);
        this.store.isSubmitting.set(false);
      },
    });
  }
}

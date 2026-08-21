import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { OrdersService } from '@features/orders/services/orders.service';
import { OrderCartStore } from '@features/orders/stores/order-cart.store';
import { CreateOrderDto } from '@features/orders/dtos/create-order.dto';
import { AuthService } from '@core/auth/auth.service';
import { ModalService } from '@shared/services/modal.service';

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
  private readonly location = inject(Location);
  private readonly modalService = inject(ModalService);
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);

  protected readonly store = inject(OrderCartStore);

  readonly username = this.authService.username;
  readonly name = this.authService.name;
  readonly email = this.authService.email;

  submitOrder(): void {
    const items = this.store.cartItems();
    if (items.length === 0 || this.store.isSubmitting() === true) return;

    this.store.isSubmitting.set(true);

    const newOrder: CreateOrderDto = {
      customerId: this.username(),
      items: items.map((item) => ({
        productId: item.product.uuid,
        quantity: item.quantityToOrder,
      })),
    };

    this.ordersService.addOrder(newOrder).subscribe({
      next: async () => {
        this.store.isSubmitting.set(false);
        this.store.clearCart();

        const confirmed = await this.modalService.open({
          title: 'Success!',
          message:
            'Order has been created successfully. Would you like to go back to the order list?',
          confirmLabel: 'Yes, go back',
          cancelLabel: 'No, stay here',
          variant: 'info',
        });

        if (confirmed) {
          this.location.back();
        }
      },
      error: async (err) => {
        console.error('[ORDER CREATION FAILED] - details: ', err);

        this.store.isSubmitting.set(false);
        await this.modalService.open({
          title: 'Failed!',
          message: 'Order has not been created successfully. Please try again. ' + err,
          confirmLabel: 'Try again',
          cancelLabel: '',
          variant: 'danger',
        });
      },
    });
  }
}

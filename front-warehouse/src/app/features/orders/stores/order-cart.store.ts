import { computed, inject, Injectable, signal } from '@angular/core';
import { ProductsService } from '@features/products/services/products.service';
import { OrderCartItem } from '../models/order.model';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { Product } from '@features/products/models/product.model';

@Injectable()
export class OrderCartStore {
  private readonly productsService = inject(ProductsService);

  readonly searchQuery = signal<string>('');
  readonly cartItems = signal<OrderCartItem[]>([]);
  readonly isSubmitting = signal<boolean>(false);

  readonly stockWarningMessage = signal<string | null>(null);

  readonly debouncedSearchQuery = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  readonly productResource = rxResource({
    params: () => ({ query: this.debouncedSearchQuery() }),
    stream: ({ params }) => {
      const q = params.query;
      return q
        ? this.productsService.getAllProducts({ pageNumber: 1, pageSize: 5, name: q })
        : of(null);
    },
  });

  readonly products = computed(() => {
    const response = this.productResource.value();
    return Array.isArray(response) ? response : (response?.data ?? []);
  });

  readonly totalPrice = computed(() =>
    this.cartItems().reduce((total, item) => {
      const price = Number(item.product?.price) || 0;
      const qty = Number(item.quantityToOrder) || 0;
      return total + price * qty;
    }, 0),
  );
  readonly totalItemsCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantityToOrder, 0),
  );

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  addProduct(product: Product): void {
    this.cartItems.update((items) => {
      const index = items.findIndex((i) => i.product.uuid === product.uuid);
      if (index > -1) {
        const newQty = items[index].quantityToOrder + 1;
        if (newQty > items[index].product.quantity) {
          this.showWarning(items[index].product.name, items[index].product.quantity);
          return [...items];
        }
        const updated = [...items];
        updated[index] = {
          ...updated[index],
          quantityToOrder: updated[index].quantityToOrder + 1,
        };
        return updated;
      }

      if (product.quantity <= 0) {
        this.showWarning(product.name, product.quantity);
        return [...items];
      }

      return [...items, { product, quantityToOrder: 1 }];
    });
    this.searchQuery.set('');
  }

  updateQuantity(productId: string, delta: number): void {
    this.clearWarning();
    this.cartItems.update((items) =>
      items
        .map((item) => {
          if (item.product.uuid === productId) {
            const newQty = item.quantityToOrder + delta;
            if (newQty > item.product.quantity) {
              this.showWarning(item.product.name, item.product.quantity);
              return item;
            }
            return newQty > 0 ? { ...item, quantityToOrder: newQty } : null;
          }
          return item;
        })
        .filter((item) => item !== null),
    );
  }

  removeItem(productId: string): void {
    this.cartItems.update((items) => items.filter((item) => item.product.uuid !== productId));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  private setStockWarning(message: string): void {
    this.stockWarningMessage.set(message);
    setTimeout(() => {
      if (this.stockWarningMessage() === message) {
        this.stockWarningMessage.set(null);
      }
    }, 4000);
  }

  showWarning(name: string, quantity: number): void {
    this.setStockWarning(
      `Cannot increase quantity for "${name}". Maximum available stock is ${quantity}.`,
    );
  }

  clearWarning(): void {
    this.stockWarningMessage.set(null);
  }
}

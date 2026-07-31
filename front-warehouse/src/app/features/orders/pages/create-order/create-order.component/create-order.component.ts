import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

export interface CustomerOption {
  id: string;
  name: string;
  email: string;
  taxId: string; // NIP
  paymentTerms: string;
  shippingAddress: string;
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  stockAvailable: number;
}

export interface OrderCartItem {
  product: ProductOption;
  quantity: number;
}

@Component({
  selector: 'app-create-order.component',
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.scss',
})
export class CreateOrderComponent {
  readonly availableCustomers: CustomerOption[] = [
    {
      id: 'cust-101',
      name: 'Acme Corp',
      email: 'procurement@acme.com',
      taxId: 'PL9876543210',
      paymentTerms: 'Net 30 Days',
      shippingAddress: 'Industrial Ave 12, 00-950 Warsaw, Poland',
    },
    {
      id: 'cust-102',
      name: 'TechGlobal Ltd',
      email: 'orders@techglobal.io',
      taxId: 'GB123456789',
      paymentTerms: 'Prepayment',
      shippingAddress: 'Silicon Tower 4, London, UK',
    },
    {
      id: 'cust-103',
      name: 'Apex Logistics',
      email: 'admin@apex.de',
      taxId: 'DE554433221',
      paymentTerms: 'Net 14 Days',
      shippingAddress: 'Logistikpark 1, Frankfurt, Germany',
    },
  ];

  readonly catalogProducts: ProductOption[] = [
    {
      id: 'prod-01',
      sku: 'RTR-X1',
      name: 'Enterprise Router X1',
      unitPrice: 1925.0,
      stockAvailable: 45,
    },
    {
      id: 'prod-02',
      sku: 'SFP-10G',
      name: 'SFP+ Fiber Module 10G',
      unitPrice: 100.0,
      stockAvailable: 230,
    },
    {
      id: 'prod-03',
      sku: 'DCK-4K',
      name: '4K Docking Station Dual Display',
      unitPrice: 258.1,
      stockAvailable: 12,
    },
    {
      id: 'prod-04',
      sku: 'CAB-C6A',
      name: 'Cat6a Patch Cable 5m',
      unitPrice: 15.5,
      stockAvailable: 500,
    },
  ];

  // --- STATE SIGNALS ---
  readonly selectedCustomerId = signal<string>('cust-101');
  readonly customNotes = signal<string>('');
  readonly discountPercent = signal<number>(0);
  readonly cartItems = signal<OrderCartItem[]>([
    { product: this.catalogProducts[0], quantity: 2 },
    { product: this.catalogProducts[1], quantity: 5 },
  ]);

  readonly productSearchQuery = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  private router = inject(Router);

  // --- COMPUTED SIGNALS ---
  readonly selectedCustomer = computed(
    () => this.availableCustomers.find((c) => c.id === this.selectedCustomerId()) ?? null,
  );

  readonly filteredCatalog = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    if (!query) return [];
    return this.catalogProducts.filter(
      (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query),
    );
  });

  readonly subtotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.product.unitPrice * item.quantity, 0),
  );

  readonly discountAmount = computed(() => (this.subtotal() * this.discountPercent()) / 100);

  readonly netAmount = computed(() => this.subtotal() - this.discountAmount());

  readonly taxAmount = computed(() => this.netAmount() * 0.23); // 23% VAT

  readonly totalAmount = computed(() => this.netAmount() + this.taxAmount());

  // --- ACTIONS ---
  selectCustomer(customerId: string): void {
    this.selectedCustomerId.set(customerId);
  }

  addProductToCart(product: ProductOption): void {
    const existingIndex = this.cartItems().findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      this.cartItems.update((items) => {
        const updated = [...items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      });
    } else {
      this.cartItems.update((items) => [...items, { product, quantity: 1 }]);
    }
    this.productSearchQuery.set('');
  }

  updateQuantity(productId: string, delta: number): void {
    this.cartItems.update((items) =>
      items
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is OrderCartItem => item !== null),
    );
  }

  removeCartItem(productId: string): void {
    this.cartItems.update((items) => items.filter((item) => item.product.id !== productId));
  }

  setDiscount(percent: number): void {
    this.discountPercent.set(Math.max(0, Math.min(100, percent)));
  }

  submitOrder(status: 'DRAFT' | 'CONFIRMED'): void {
    if (this.cartItems().length === 0) return;
    console.log(status);
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.router.navigate(['/orders']);
    }, 800);
  }
}

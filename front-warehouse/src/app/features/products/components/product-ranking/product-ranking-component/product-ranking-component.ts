import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product } from '@features/products/models/product.model';
import { ProductNotificationService } from '@features/products/services/product-notification.service';
import { ProductsService } from '@features/products/services/products.service';

@Component({
  selector: 'app-product-ranking-component',
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-ranking-component.html',
  styleUrl: './product-ranking-component.scss',
})
export class ProductRankingComponent implements OnInit {
  private productService = inject(ProductsService);
  private destroyRef = inject(DestroyRef);
  private productNotificationService = inject(ProductNotificationService);

  readonly topProducts = signal<Product[]>([]);

  ngOnInit() {
    this.productNotificationService.startConnection();
    this.getTopProducts();
    this.listenTopProductsUpdated();
    this.listenProductDeleted();
  }

  // Get the top product list
  private getTopProducts(): void {
    this.productService
      .getTopProducts(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.topProducts.set(response);
        },
        error: (err) => {
          console.error('Error while retrieving the top product list: ', err);
        },
      });
  }

  //Listen TopProductsUpdated event
  private listenTopProductsUpdated(): void {
    this.productNotificationService.topProductsUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getTopProducts();
      });
  }

  //Listen ProductDeleted event
  private listenProductDeleted(): void {
    this.productNotificationService.productDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deletedUuid: string) => {
        this.topProducts.update((products) =>
          products.filter((product) => product.uuid != deletedUuid),
        );
      });
  }
}

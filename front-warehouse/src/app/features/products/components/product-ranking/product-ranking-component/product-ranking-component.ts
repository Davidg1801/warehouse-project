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
  private readonly productService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productNotificationService = inject(ProductNotificationService);
  private readonly rankingLimit = 10;
  readonly isLoading = signal(true);
  readonly topProducts = signal<Product[]>([]);

  ngOnInit() {
    this.productNotificationService.startConnection();
    this.getTopProducts();
    this.listenTopProductsUpdated();
    this.listenProductDeleted();
  }

  private getTopProducts(): void {
    this.isLoading.set(true);
    this.productService
      .getTopProducts(this.rankingLimit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.topProducts.set(response);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error while retrieving the top product list: ', err);
          this.isLoading.set(false);
        },
      });
  }

  private listenTopProductsUpdated(): void {
    this.productNotificationService.topProductsUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getTopProducts();
      });
  }

  private listenProductDeleted(): void {
    this.productNotificationService.productDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deletedUuid: string) => {
        this.topProducts.update((products) =>
          products.filter((product) => product.uuid !== deletedUuid),
        );
      });
  }
}

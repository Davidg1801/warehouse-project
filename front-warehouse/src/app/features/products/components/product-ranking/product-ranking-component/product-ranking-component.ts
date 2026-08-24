import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly productNotificationService = inject(ProductNotificationService);
  private readonly rankingLimit = signal(5);

  readonly topProductsResource = rxResource({
    params: () => ({ limit: this.rankingLimit() }),
    stream: ({ params }) => this.productService.getTopProducts(params.limit),
  });

  readonly topProducts = this.topProductsResource.value;
  readonly isLoading = this.topProductsResource.isLoading;

  readonly topProductsUpdated = this.productNotificationService.topProductsUpdated$
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      this.topProductsResource.reload();
    });

  readonly productDeleted = this.productNotificationService.productDeleted$
    .pipe(takeUntilDestroyed())
    .subscribe((deletedUuid: string) => {
      this.topProductsResource.update((products) =>
        products ? products.filter((p) => p.uuid !== deletedUuid) : [],
      );
    });

  ngOnInit() {
    this.productNotificationService.startConnection();
  }
}

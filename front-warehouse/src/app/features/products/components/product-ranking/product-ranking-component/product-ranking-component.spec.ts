import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRankingComponent } from './product-ranking-component';
import { ProductNotificationService } from '@features/products/services/product-notification.service';
import { ProductsService } from '@features/products/services/products.service';
import { of, Subject } from 'rxjs';

describe('ProductRankingComponent', () => {
  let component: ProductRankingComponent;
  let fixture: ComponentFixture<ProductRankingComponent>;

  let productsService: {
    getTopProducts: ReturnType<typeof vi.fn>;
  };

  let notificationService: {
    startConnection: ReturnType<typeof vi.fn>;
    topProductsUpdated$: Subject<void>;
    productDeleted$: Subject<string>;
  };

  const products = [
    {
      uuid: '1',
      name: 'RTX 4090',
      categoryId: 1,
      categoryName: 'GPU',
      quantity: 5,
      price: 1000,
    },
    {
      uuid: '2',
      name: 'Ryzen 9800X3D',
      categoryId: 2,
      categoryName: 'CPU',
      quantity: 3,
      price: 500,
    },
  ];

  beforeEach(async () => {
    productsService = {
      getTopProducts: vi.fn().mockReturnValue(of(products)),
    };
    notificationService = {
      startConnection: vi.fn(),
      topProductsUpdated$: new Subject<void>(),
      productDeleted$: new Subject<string>(),
    };
    await TestBed.configureTestingModule({
      imports: [ProductRankingComponent],
      providers: [
        {
          provide: ProductNotificationService,
          useValue: notificationService,
        },
        {
          provide: ProductsService,
          useValue: productsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductRankingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start SignalR connection on init', () => {
    expect(notificationService.startConnection).toHaveBeenCalled();
  });

  it('should load top products on init', () => {
    expect(productsService.getTopProducts).toHaveBeenCalledWith(10);
  });

  it('should display empty state', () => {
    productsService.getTopProducts.mockReturnValue(of([]));
    fixture = TestBed.createComponent(ProductRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There is no product in ranking');
  });

  it('should reload ranking when TopProductsUpdated event is received', () => {
    notificationService.topProductsUpdated$.next();

    expect(productsService.getTopProducts).toHaveBeenCalledTimes(2);
  });

  it('should remove deleted product from ranking', () => {
    notificationService.productDeleted$.next('1');

    expect(component.topProducts()).toEqual([
      {
        uuid: '2',
        name: 'Ryzen 9800X3D',
        categoryId: 2,
        categoryName: 'CPU',
        quantity: 3,
        price: 500,
      },
    ]);
  });
});

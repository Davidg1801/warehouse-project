import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsListComponent } from './products-list-component';
import { NEVER, of } from 'rxjs';
import { ModalService } from '@shared/services/modal.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { ProductsService } from '@features/products/services/products.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductNotificationService } from '@features/products/services/product-notification.service';

describe('ProductsListComponent', () => {
  let component: ProductsListComponent;
  let fixture: ComponentFixture<ProductsListComponent>;

  const notificationServiceMock = {
    startConnection: vi.fn(),
    productUpdated$: NEVER,
    productDeleted$: NEVER,
    topProductsUpdated$: NEVER,
  };

  const productsServiceMock = {
    getAllProducts: vi.fn().mockReturnValue(
      of({
        data: [],
        totalCount: 0,
        totalPages: 1,
      }),
    ),
    deleteProduct: vi.fn(),
    getTopProducts: vi.fn().mockReturnValue(of([])), // Brakująca metoda
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ProductsListComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              queryParams: {},
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
          },
        },
        {
          provide: ProductsService,
          useValue: productsServiceMock,
          deleteProduct: vi.fn(),
        },
        {
          provide: CategoriesService,
          useValue: {
            getAllCategories: vi.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: ModalService,
          useValue: {
            open: vi.fn(),
          },
        },
        {
          provide: ProductNotificationService,
          useValue: notificationServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsListComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsListComponent } from './products-list-component';
import { of } from 'rxjs';
import { ModalService } from '@shared/services/modal.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { ProductsService } from '@features/products/services/products.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('ProductsListComponent', () => {
  let component: ProductsListComponent;
  let fixture: ComponentFixture<ProductsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsListComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
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
          useValue: {
            getAllProducts: vi.fn().mockReturnValue(
              of({
                data: [],
                totalCount: 0,
                totalPages: 1,
              }),
            ),
            deleteProduct: vi.fn(),
          },
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

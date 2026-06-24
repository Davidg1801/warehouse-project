import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProductComponent } from './edit-product-component';
import { ProductsService } from '@features/products/services/products.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { of } from 'rxjs';
import { ModalService } from '@shared/services/modal.service';
import { ActivatedRoute } from '@angular/router';

describe('EditProductComponent', () => {
  let component: EditProductComponent;
  let fixture: ComponentFixture<EditProductComponent>;

  const productsServiceMock = {
    getProduct: vi.fn(),
    updateProduct: vi.fn(),
  };

  const categoriesServiceMock = {
    getAllCategories: vi.fn(),
  };

  const modalServiceMock = {
    open: vi.fn(),
  };

  const locationMock = {
    back: vi.fn(),
  };

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    categoriesServiceMock.getAllCategories.mockReturnValue(of([]));
    activatedRouteMock.snapshot.paramMap.get.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [EditProductComponent],
      providers: [
        { provide: ProductsService, useValue: productsServiceMock },
        {
          provide: CategoriesService,
          useValue: categoriesServiceMock,
        },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: Location, useValue: locationMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('required field validation', () => {
    it('should require name', () => {
      const control = component.editForm.controls['name'];
      control.setValue('');
      expect(control.hasError('required')).toBe(true);
    });

    it('should require categoryId', () => {
      const control = component.editForm.controls['categoryId'];
      control.setValue(null);
      expect(control.hasError('required')).toBe(true);
    });
  });

  describe('quantity validation', () => {
    it('should fail if quantity < 0', () => {
      const control = component.editForm.controls['quantity'];
      control.setValue(-1);
      expect(control.hasError('min')).toBe(true);
    });

    it('should fail if quantity > 9999', () => {
      const control = component.editForm.controls['quantity'];
      control.setValue(99991);
      expect(control.hasError('max')).toBe(true);
    });
  });

  describe('price validation', () => {
    it('should fail if price < 0.01', () => {
      const control = component.editForm.controls['price'];
      control.setValue(0);
      expect(control.hasError('min')).toBe(true);
    });

    it('should fail if price > 9999999', () => {
      const control = component.editForm.controls['price'];
      control.setValue(99999991);
      expect(control.hasError('max')).toBe(true);
    });
  });

  it('should load categories on Init', () => {
    const categories = [
      { id: 1, name: 'Category 1' },
      { id: 2, name: 'Category 2' },
    ];

    categoriesServiceMock.getAllCategories.mockReturnValue(of(categories));
    component.ngOnInit();
    expect(categoriesServiceMock.getAllCategories).toHaveBeenCalled();
    expect(component.categories()).toEqual(categories);
  });

  it('should load product when uuid exists', () => {
    activatedRouteMock.snapshot.paramMap.get.mockReturnValue('123');

    const product = {
      uuid: '123',
      name: 'New product',
      categoryId: 1,
      quantity: 100,
      price: 499.99,
    };

    productsServiceMock.getProduct.mockReturnValue(of(product));
    component.ngOnInit();

    expect(productsServiceMock.getProduct).toHaveBeenCalledWith('123');
    expect(component.editForm.getRawValue()).toEqual({
      name: 'New product',
      categoryId: 1,
      quantity: 100,
      price: 499.99,
    });
  });

  it('should not edit product when form is invalid', () => {
    const spy = vi.spyOn(component, 'editProduct');

    component.ngOnInit();
    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should edit product when form is valid', () => {
    const spy = vi.spyOn(component, 'editProduct').mockImplementation(() => undefined);

    activatedRouteMock.snapshot.paramMap.get.mockReturnValue('123');

    component.ngOnInit();

    component.editForm.setValue({
      name: 'New product',
      categoryId: 1,
      quantity: 100,
      price: 499.99,
    });

    component.onSubmit();

    expect(spy).toHaveBeenCalledWith({
      uuid: '123',
      name: 'New product',
      categoryId: 1,
      quantity: 100,
      price: 499.99,
    });
  });
});

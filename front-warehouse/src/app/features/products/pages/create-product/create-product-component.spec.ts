import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CreateProductComponent } from './create-product-component';
import { ProductsService } from '@features/products/services/products.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { ModalService } from '@shared/services/modal.service';

describe('CreateProductComponent', () => {
  let component: CreateProductComponent;
  let fixture: ComponentFixture<CreateProductComponent>;

  const productsServiceMock = {
    addProduct: vi.fn(),
  };

  const categoriesServiceMock = {
    getAllCategories: vi.fn().mockReturnValue(of([])),
  };

  const modalServiceMock = {
    open: vi.fn(),
  };

  const locationMock = {
    back: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProductComponent],
      providers: [
        { provide: ProductsService, useValue: productsServiceMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: Location, useValue: locationMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProductComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('required field validation', () => {
    it('should require name', () => {
      const control = component.form.controls['name'];
      control.setValue('');
      expect(control.hasError('required')).toBe(true);
    });

    it('should require categoryId', () => {
      const control = component.form.controls['categoryId'];
      control.setValue(null);
      expect(control.hasError('required')).toBe(true);
    });
  });

  describe('quantity validation', () => {
    it('should fail if quantity < 0', () => {
      const control = component.form.controls['quantity'];
      control.setValue(-1);
      expect(control.hasError('min')).toBe(true);
    });

    it('should fail if quantity > 9999', () => {
      const control = component.form.controls['quantity'];
      control.setValue(99991);
      expect(control.hasError('max')).toBe(true);
    });
  });

  describe('price validation', () => {
    it('should fail if price < 0.01', () => {
      const control = component.form.controls['price'];
      control.setValue(0);
      expect(control.hasError('min')).toBe(true);
    });

    it('should fail if price > 9999999', () => {
      const control = component.form.controls['price'];
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

  it('should not add product when form is invalid', () => {
    const spy = vi.spyOn(component, 'saveProduct');

    component.ngOnInit();
    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should add product when form is valid', () => {
    const spy = vi.spyOn(component, 'saveProduct').mockImplementation(() => undefined);

    component.ngOnInit();

    component.form.setValue({
      name: 'New product',
      categoryId: 1,
      quantity: 100,
      price: 499.99,
    });

    component.onSubmit();

    expect(spy).toHaveBeenCalledWith({
      name: 'New product',
      categoryId: 1,
      quantity: 100,
      price: 499.99,
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProductComponent } from './edit-product-component';
import { of, throwError } from 'rxjs';
import { ProductsService } from '@features/products/services/products.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { ModalService } from '@shared/services/modal.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { EditProductDto } from '@features/products/dtos/edit-product.dto';
import { Location } from '@angular/common';

describe('EditProductComponent', () => {
  let component: EditProductComponent;
  let fixture: ComponentFixture<EditProductComponent>;

  const mockProduct = {
    uuid: 'test-uuid-123',
    name: 'Existing Product',
    categoryId: 1,
    quantity: 10,
    price: 99.99,
  };

  const productsServiceMock = {
    getProduct: vi.fn().mockReturnValue(of(mockProduct)),
    updateProduct: vi.fn().mockReturnValue(of(undefined)),
  };

  const categoriesServiceMock = {
    getAllCategories: vi.fn().mockReturnValue(
      of([
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ]),
    ),
  };

  const modalServiceMock = {
    open: vi.fn().mockResolvedValue(true),
  };

  const locationMock = {
    back: vi.fn(),
  };

  const activatedRouteMock = {
    paramMap: of(convertToParamMap({ uuid: 'test-uuid-123' })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    productsServiceMock.getProduct.mockReturnValue(of(mockProduct));
    productsServiceMock.updateProduct.mockReturnValue(of(undefined));
    modalServiceMock.open.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [EditProductComponent],
      providers: [
        { provide: ProductsService, useValue: productsServiceMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: Location, useValue: locationMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProductComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product data and populate form via effect', () => {
    expect(productsServiceMock.getProduct).toHaveBeenCalledWith('test-uuid-123');
    expect(component.editForm.getRawValue()).toEqual({
      name: 'Existing Product',
      categoryId: 1,
      quantity: 10,
      price: 99.99,
    });
  });

  describe('field validation', () => {
    it('should require name', () => {
      const control = component.editForm.controls.name;
      control.setValue('');
      expect(control.hasError('required')).toBe(true);
    });

    it('should require categoryId', () => {
      const control = component.editForm.controls.categoryId;
      control.setValue(null);
      expect(control.hasError('required')).toBe(true);
    });

    it('should fail if quantity is less than 0', () => {
      const control = component.editForm.controls.quantity;
      control.setValue(-1);
      expect(control.hasError('min')).toBe(true);
    });

    it('should fail if price is less than 0.01', () => {
      const control = component.editForm.controls.price;
      control.setValue(0);
      expect(control.hasError('min')).toBe(true);
    });
  });

  describe('form submission', () => {
    it('should not update product if form is invalid', () => {
      const spy = vi.spyOn(component, 'updateProduct');
      component.editForm.controls.name.setValue('');

      component.onSubmit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should update product successfully and navigate back when confirmed in modal', async () => {
      const updatedDto: EditProductDto = {
        name: 'Updated Product Name',
        categoryId: 2,
        quantity: 50,
        price: 149.99,
        uuid: 'test-uuid-123',
      };

      component.editForm.setValue({
        name: 'Updated Product Name',
        categoryId: 2,
        quantity: 50,
        price: 149.99,
      });

      component.onSubmit();

      expect(productsServiceMock.updateProduct).toHaveBeenCalledWith(updatedDto);
      expect(modalServiceMock.open).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Success!' }),
      );

      // Czekamy na rozwiązanie Promise z modalService.open()
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(locationMock.back).toHaveBeenCalledTimes(1);
    });

    it('should open error modal when update fails', async () => {
      productsServiceMock.updateProduct.mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      component.onSubmit();

      expect(modalServiceMock.open).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Failed!' }),
      );
    });
  });

  describe('navigation', () => {
    it('should go back when onCancel is called', () => {
      component.onCancel();
      expect(locationMock.back).toHaveBeenCalledTimes(1);
    });
  });
});

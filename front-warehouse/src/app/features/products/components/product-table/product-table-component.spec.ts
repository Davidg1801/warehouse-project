import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTableComponent } from './product-table-component';
import { provideRouter } from '@angular/router';

describe('ProductTableComponent', () => {
  let component: ProductTableComponent;
  let fixture: ComponentFixture<ProductTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('products', []);

    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //DISPLAY PRODUCTS
  it('should display product data', () => {
    fixture.componentRef.setInput('products', [
      {
        uuid: '123',
        name: 'RTX 4090',
        categoryId: 1,
        categoryName: 'GPU',
        price: 2000,
        quantity: 5,
      },
    ]);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('RTX 4090');

    expect(fixture.nativeElement.textContent).toContain('GPU');
  });

  //DISPLAY INFO WHEN NO PRODUCTS EXIST
  it('should show empty state when no products exist', () => {
    fixture.componentRef.setInput('products', []);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No products found');
  });

  //EMIT PRODUCT ID WHEN USER CLICKS DELETE BUTTON
  it('should emit product id when delete clicked', () => {
    const emittedValues: string[] = [];

    component.productDeleted.subscribe((uuid) => {
      emittedValues.push(uuid);
    });

    fixture.componentRef.setInput('products', [
      {
        uuid: '123',
        name: 'HyperX Cloud III',
        categoryId: 3,
        categoryName: 'Motherboards',
        price: 111,
        quantity: 10,
      },
    ]);

    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('[data-testid="delete-product-button"]');
    button.click();
    expect(emittedValues).toEqual(['123']);
  });
});

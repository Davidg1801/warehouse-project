import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTableComponent } from './product-table-component';

describe('ProductTableComponent', () => {
  let component: ProductTableComponent;
  let fixture: ComponentFixture<ProductTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

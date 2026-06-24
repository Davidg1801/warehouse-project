import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPaginationComponent } from './product-pagination-component';

describe('ProductPaginationComponent', () => {
  let component: ProductPaginationComponent;
  let fixture: ComponentFixture<ProductPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 10);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

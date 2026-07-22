import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRankingComponent } from './product-ranking-component';

describe('ProductRankingComponent', () => {
  let component: ProductRankingComponent;
  let fixture: ComponentFixture<ProductRankingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRankingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductRankingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

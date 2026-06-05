import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryFiltersComponent } from './category-filters-component';

describe('CategoryFiltersComponent', () => {
  let component: CategoryFiltersComponent;
  let fixture: ComponentFixture<CategoryFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFiltersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

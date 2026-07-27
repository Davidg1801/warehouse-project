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

  it('should disable previous button on first page', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector('[data-testid="prev-page-button"]');

    expect(previousButton.disabled).toBeTruthy();
  });

  it('should disable next button on the last page', () => {
    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector('[data-testid="next-page-button"]');
    expect(nextButton.disabled).toBeTruthy();
  });

  it('should emit previous page number', () => {
    vi.spyOn(component.pageChanged, 'emit');

    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('totalPages', 10);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
    component.onPrevPage();

    expect(component.pageChanged.emit).toHaveBeenCalledWith(4);
  });

  it('should emit next page number', () => {
    vi.spyOn(component.pageChanged, 'emit');

    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('totalPages', 10);
    fixture.componentRef.setInput('pageSize', 10);
    component.onNextPage();

    expect(component.pageChanged.emit).toHaveBeenCalledWith(6);
  });

  it('should emit next page when user clicks next button', () => {
    const emittedValues: number[] = [];

    component.pageChanged.subscribe((value) => {
      emittedValues.push(value);
    });

    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="next-page-button"]');
    button.click();
    expect(emittedValues).toEqual([3]);
  });

  //EMIT PREV PAGE AFTER CLICKING BUTTON
  it('should emit prev page when user clicks prev button', () => {
    const emittedValues: number[] = [];

    component.pageChanged.subscribe((value) => {
      emittedValues.push(value);
    });

    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="prev-page-button"]');
    button.click();
    expect(emittedValues).toEqual([1]);
  });

  it('should emit new page size when user changes select', () => {
    const emittedValues: number[] = [];
    component.pageSizeChanged.subscribe((value) => {
      emittedValues.push(value);
    });

    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('[data-testid="page-size-select"]');
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(emittedValues).toEqual([50]);
  });

  it('should ignore invalid page size', () => {
    vi.spyOn(component.pageSizeChanged, 'emit');

    const event = {
      target: {
        value: 'abc',
      },
    } as unknown as Event;

    component.onPageSizeChange(event);
    expect(component.pageSizeChanged.emit).not.toHaveBeenCalled();
  });
});

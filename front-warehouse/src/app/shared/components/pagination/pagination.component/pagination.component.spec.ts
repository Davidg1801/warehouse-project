import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationComponent } from './pagination.component';
import { Pagination } from '@shared/models/pagination.model';
import { FormsModule } from '@angular/forms';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('totalCount', 55);
    fixture.componentRef.setInput('pageSizeOptions', [10, 25, 50]);
    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable previous button on first page', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector('[data-testid="prev-page-button"]');
    expect(previousButton.disabled).toBeTruthy();
  });

  it('should disable next button on the last page', () => {
    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector('[data-testid="next-page-button"]');
    expect(nextButton.disabled).toBeTruthy();
  });

  it('should emit previous page number', () => {
    vi.spyOn(component.pageChange, 'emit');

    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();
    component.onPageChange(component.currentPage() - 1);

    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('should emit next page number', () => {
    vi.spyOn(component.pageChange, 'emit');

    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();
    component.onPageChange(component.currentPage() + 1);

    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('should emit next page when user clicks next button', () => {
    const emittedValues: number[] = [];

    component.pageChange.subscribe((value) => emittedValues.push(value));

    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="next-page-button"]');
    button.click();
    expect(emittedValues).toEqual([3]);
  });

  it('should emit prev page when user clicks prev button', () => {
    const emittedValues: number[] = [];

    component.pageChange.subscribe((value) => emittedValues.push(value));

    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="prev-page-button"]');
    button.click();
    expect(emittedValues).toEqual([1]);
  });

  it('should emit new page size and page number 1 when user changes select', async () => {
    const emittedValues: Pagination[] = [];
    component.pageSizeChange.subscribe((value) => {
      emittedValues.push(value);
    });

    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('[data-testid="page-size-select"]');
    select.value = select.options[2].value;
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(emittedValues).toEqual([{ pageNumber: 1, pageSize: 50 }]);
  });

  it('should ignore invalid page size', () => {
    vi.spyOn(component.pageSizeChange, 'emit');
    component.onPageSizeChange(-1);
    expect(component.pageSizeChange.emit).not.toHaveBeenCalled();
  });
});

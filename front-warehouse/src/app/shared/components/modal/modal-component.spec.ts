import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal-component';
import { signal } from '@angular/core';
import { ModalService } from '@shared/services/modal.service';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  const modalServiceMock = {
    isOpen: signal(false),
    config: signal({
      title: 'Test Title',
      message: 'Test Message',
      variant: 'info',
      cancelLabel: 'Cancel',
      confirmLabel: 'Confirm',
    }),
    submitResult: vi.fn(),
  };

  beforeEach(async () => {
    modalServiceMock.isOpen.set(false);
    modalServiceMock.config.set({
      title: 'Test Title',
      message: 'Test Message',
      variant: 'info',
      cancelLabel: 'Cancel',
      confirmLabel: 'Confirm',
    });

    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });

    await TestBed.configureTestingModule({
      imports: [ModalComponent],
      providers: [{ provide: ModalService, useValue: modalServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and message from ModalService config', () => {
    const titleElement = fixture.nativeElement.querySelector(
      '[data-testid="modal-title"]',
    ) as HTMLElement;
    const textElement = fixture.nativeElement.querySelector(
      '[data-testid="modal-text"]',
    ) as HTMLElement;

    expect(titleElement.textContent).toContain('Test Title');
    expect(textElement.textContent).toContain('Test Message');
  });

  it('should open dialog when modalService.isOpen changes to true', async () => {
    const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

    modalServiceMock.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogEl.showModal).toHaveBeenCalled();
  });

  it('should close dialog when modalService.isOpen changes to false', async () => {
    const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

    modalServiceMock.isOpen.set(true);
    fixture.detectChanges();

    modalServiceMock.isOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogEl.close).toHaveBeenCalled();
  });

  it('should submit true and close dialog when confirm button is clicked', () => {
    const confirmtButton = fixture.nativeElement.querySelector(
      '[data-testid="modal-confirm-btn"]',
    ) as HTMLButtonElement;
    confirmtButton.click();
    expect(modalServiceMock.submitResult).toHaveBeenCalledWith(true);
  });

  it('should submit false and close dialog when cancel button is clicked', () => {
    const confirmtButton = fixture.nativeElement.querySelector(
      '[data-testid="modal-cancel-btn"]',
    ) as HTMLButtonElement;
    confirmtButton.click();
    expect(modalServiceMock.submitResult).toHaveBeenCalledWith(false);
  });

  it('should hide cancel button when cancelLabel is empty', async () => {
    modalServiceMock.config.set({
      ...modalServiceMock.config(),
      cancelLabel: '',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const cancelBtn = fixture.nativeElement.querySelector('[data-testid="modal-cancel-btn"]');
    expect(cancelBtn).toBeNull();
  });
});

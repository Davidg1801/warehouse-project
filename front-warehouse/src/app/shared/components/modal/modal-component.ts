import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-modal-component',
  standalone: true,
  imports: [NgClass],
  templateUrl: './modal-component.html',
  styleUrl: './modal-component.scss',
})
export class ModalComponent {
  protected modalService = inject(ModalService);
  private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogElement');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      const isOpen = this.modalService.isOpen();

      if (dialog && isOpen && !dialog.open) {
        dialog.showModal();
      }
    });
  }

  confirm() {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && dialog.open) {
      dialog.close();
    }
    this.modalService.submitResult(true);
  }

  close() {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && dialog.open) {
      dialog.close();
    }
    this.modalService.submitResult(false);
  }
}

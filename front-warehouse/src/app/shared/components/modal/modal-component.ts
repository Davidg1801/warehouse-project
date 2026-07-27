import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './modal-component.html',
  styleUrl: './modal-component.scss',
})
export class ModalComponent {
  protected readonly modalService = inject(ModalService);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogElement');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) return;

      const isOpen = this.modalService.isOpen();
      if (isOpen && !dialog.open) {
        dialog.showModal();
      } else if (!isOpen && dialog.open) {
        dialog.close();
      }
    });
  }

  confirm(): void {
    this.closeDialogNative();
    this.modalService.submitResult(true);
  }

  close(): void {
    this.closeDialogNative();
    this.modalService.submitResult(false);
  }

  private closeDialogNative(): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
  }
}

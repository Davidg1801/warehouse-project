import { Injectable, signal } from '@angular/core';
import { ModalConfig } from '../models/modal.model';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  isOpen = signal<boolean>(false);
  config = signal<ModalConfig>({ title: '', message: '' });

  private nativeDialog?: HTMLDialogElement;
  private modalResolve?: (value: boolean) => void;

  registerDialog(dialog: HTMLDialogElement) {
    this.nativeDialog = dialog;
  }

  open(config: ModalConfig): Promise<boolean> {
    this.config.set(config);
    this.isOpen.set(true);

    if (this.nativeDialog) {
      this.nativeDialog.showModal();
    }

    return new Promise<boolean>((resolve) => {
      this.modalResolve = resolve;
    });
  }

  submitResult(result: boolean) {
    this.isOpen.set(false);
    if (this.modalResolve) {
      this.modalResolve(result);
    }
  }
}

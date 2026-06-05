import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './create-product-component.html',
  styleUrl: './create-product-component.scss',
})
export class CreateProductComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    categoryId: ['', [Validators.required]],
    quantity: ['', [Validators.required]],
    price: ['', [Validators.required, Validators.min(0.01)]],
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('onSubmit');
  }
}

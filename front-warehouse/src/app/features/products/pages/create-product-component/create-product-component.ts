import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PRODUCT_CATEGORIES } from '@features/products/constants/categories.constant';
import { CreateProductDto } from '@features/products/dto/create-product.dto';
import { ProductsService } from '@features/products/services/products-service';

@Component({
  selector: 'app-create-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './create-product-component.html',
  styleUrl: './create-product-component.scss',
})
export class CreateProductComponent {
  private router = inject(Router);
  categories = PRODUCT_CATEGORIES;
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);

  form = this.fb.group({
    name: this.fb.control<string>('', [Validators.required, Validators.maxLength(50)]),
    categoryId: this.fb.control<number | null>(null, [Validators.required]),
    quantity: this.fb.control<number | null>(null, [Validators.required]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });

  onSubmit() {
    console.log('SUBMIT FIRED');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: CreateProductDto = {
      name: value.name!,
      categoryId: value.categoryId!,
      quantity: value.quantity!,
      price: value.price!,
    };

    this.productsService.addProduct(payload).subscribe();
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}

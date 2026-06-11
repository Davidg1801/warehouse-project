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
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const newProduct: CreateProductDto = {
      name: value.name!,
      categoryId: value.categoryId!,
      quantity: value.quantity!,
      price: value.price!,
    };

    this.productsService.addProduct(newProduct).subscribe({
      next: () => {
        this.form.reset();
        const goBackToList = confirm(
          'Product has been added successfully. Would you like to go back to the product list?',
        );
        if (goBackToList) {
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        alert('An error occured while adding the product. ' + err);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}

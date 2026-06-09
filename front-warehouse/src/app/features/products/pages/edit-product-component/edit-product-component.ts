import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService } from '@features/categories/services/categories-service';
import { ProductDto } from '@features/products/dto/product.dto';
import { Category } from '@features/products/models/category.model';
import { ProductsService } from '@features/products/services/products-service';

@Component({
  selector: 'app-edit-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './edit-product-component.html',
  styleUrl: './edit-product-component.scss',
})
export class EditProductComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private uuid!: string | null;
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  // product = signal<ProductDto | null>(null);
  categories = signal<Category[]>([]);
  private fb = inject(FormBuilder);
  editForm!: FormGroup;

  ngOnInit(): void {
    this.getCategories();
    this.initForm();

    this.uuid = this.route.snapshot.paramMap.get('uuid');

    if (this.uuid) {
      this.getProduct(this.uuid);
    }
  }

  private getCategories() {
    this.categoriesService.getAllCategories().subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  private getProduct(uuid: string) {
    this.productsService.getProduct(uuid).subscribe({
      next: (product: ProductDto) => {
        // this.product.set(product);
        console.log(uuid);
        this.editForm.patchValue({
          name: product.name,
          categoryId: product.categoryId,
          quantity: product.quantity,
          price: product.price,
        });
      },
      error: (err) => {
        console.log('ERROR:', err);
      },
    });
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      name: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(50)],
        nonNullable: true,
      }),

      categoryId: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),

      quantity: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),

      price: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0.01)],
      }),
    });
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    console.log('UUID');
    console.log(this.uuid);
    const product = {
      ...this.editForm.getRawValue(),
      uuid: this.uuid,
    };

    this.productsService.updateProduct(product).subscribe({
      next: () => {
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Update failed:', err);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}

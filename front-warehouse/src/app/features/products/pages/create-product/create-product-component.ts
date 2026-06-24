import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { CreateProductDto } from '@features/products/dtos/create-product.dto';
import { ProductsService } from '@features/products/services/products.service';
import { ModalService } from '@shared/services/modal.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { Category } from '@features/categories/models/category.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './create-product-component.html',
  styleUrl: './create-product-component.scss',
})
export class CreateProductComponent implements OnInit {
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);

  categories = signal<Category[]>([]);

  form = this.fb.group({
    name: this.fb.control<string>('', [Validators.required, Validators.maxLength(50)]),
    categoryId: this.fb.control<number | null>(null, [Validators.required]),
    quantity: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(9999),
    ]),
    price: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(9999999),
    ]),
  });

  ngOnInit(): void {
    this.getCategories();
  }

  private getCategories() {
    this.categoriesService
      .getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categories.set(categories);
      });
  }

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

    this.saveProduct(newProduct);
  }

  saveProduct(newProduct: CreateProductDto) {
    this.productsService.addProduct(newProduct).subscribe({
      next: async () => {
        this.form.reset();

        const confirmed = await this.modalService.open({
          title: 'Success!',
          message:
            'Product has been added successfully. Would you like to go back to the product list?',
          confirmLabel: 'Yes, go back',
          cancelLabel: 'No, stay here',
          variant: 'primary',
        });

        if (confirmed) {
          this.location.back();
        }
      },
      error: async (err) => {
        console.log('Product has not been added: ' + err);
        await this.modalService.open({
          title: 'Failed!',
          message: 'Product has not been added successfully. Please try it again. ',
          confirmLabel: 'Try again',
          cancelLabel: '',
        });
      },
    });
  }

  onCancel(): void {
    this.location.back();
  }
}

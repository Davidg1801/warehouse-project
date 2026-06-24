import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CategoriesService } from '@features/categories/services/categories.service';
import { EditProductDto } from '@features/products/dtos/edit-product.dto';
import { ProductDto } from '@features/products/dtos/product.dto';
import { Category } from '@features/categories/models/category.model';
import { ProductsService } from '@features/products/services/products.service';
import { ModalService } from '@shared/services/modal.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-edit-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './edit-product-component.html',
  styleUrl: './edit-product-component.scss',
})
export class EditProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private uuid!: string | null;
  private destroyRef = inject(DestroyRef);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private modalService = inject(ModalService);

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
    this.categoriesService
      .getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categories.set(categories);
      });
  }

  private getProduct(uuid: string) {
    this.productsService.getProduct(uuid).subscribe({
      next: (product: ProductDto) => {
        this.editForm.patchValue({
          name: product.name,
          categoryId: product.categoryId,
          quantity: product.quantity,
          price: product.price,
        });
      },
      error: (err) => {
        console.log('An error occured while retrieving product:', err);
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
        validators: [Validators.required, Validators.min(0), Validators.max(9999)],
      }),

      price: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0.01), Validators.max(9999999)],
      }),
    });
  }

  editProduct(product: EditProductDto) {
    this.productsService.updateProduct(product).subscribe({
      next: async () => {
        const confirmed = await this.modalService.open({
          title: 'Success!',
          message: `Product ${product.name}  has been edited successfully. Would you like to go back to the product list?`,
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
          message: 'Product has not been edited successfully. Please try it again. ',
          confirmLabel: 'Try again',
          cancelLabel: '',
        });
      },
    });
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const product = {
      ...this.editForm.getRawValue(),
      uuid: this.uuid,
    };

    this.editProduct(product);
  }

  onCancel(): void {
    this.location.back();
  }
}

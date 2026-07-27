import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  Signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { CreateProductDto } from '@features/products/dtos/create-product.dto';
import { ProductsService } from '@features/products/services/products.service';
import { ModalService } from '@shared/services/modal.service';
import { CategoriesService } from '@features/categories/services/categories.service';
import { Category } from '@features/categories/models/category.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

interface CreateProductForm {
  name: FormControl<string>;
  categoryId: FormControl<number | null>;
  quantity: FormControl<number | null>;
  price: FormControl<number | null>;
}

@Component({
  selector: 'app-create-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-product-component.html',
  styleUrl: './create-product-component.scss',
})
export class CreateProductComponent {
  private readonly location = inject(Location);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(ModalService);

  readonly isSaving = signal(false);

  readonly categories: Signal<Category[]> = toSignal(this.categoriesService.getAllCategories(), {
    initialValue: [],
  });

  readonly form = new FormGroup<CreateProductForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    categoryId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    quantity: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(9999)],
    }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(9999999)],
    }),
  });

  saveProduct(newProduct: CreateProductDto) {
    this.isSaving.set(true);
    this.productsService
      .addProduct(newProduct)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async () => {
          this.isSaving.set(false);
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
          this.isSaving.set(false);
          console.log('Product has not been added: ' + err);
          await this.modalService.open({
            title: 'Failed!',
            message: 'Product has not been added successfully. Please try it again. ',
            confirmLabel: 'Try again',
            cancelLabel: '',
            variant: 'primary',
          });
        },
      });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const newProduct: CreateProductDto = {
      name: value.name,
      categoryId: value.categoryId!,
      quantity: value.quantity!,
      price: value.price!,
    };

    this.saveProduct(newProduct);
  }

  onCancel(): void {
    this.location.back();
  }
}

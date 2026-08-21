import { ChangeDetectionStrategy, Component, inject, signal, Signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { CreateProductDto } from '@features/products/dtos/create-product.dto';
import { ProductsService } from '@features/products/services/products.service';
import { ModalService } from '@shared/services/modal.service';
import { CategoriesService, Category } from '@features/categories';
import { toSignal } from '@angular/core/rxjs-interop';
import { integerValidator } from '@shared/validators/integer.validator';

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
      validators: [Validators.required, Validators.min(0), Validators.max(9999), integerValidator],
    }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(9999999)],
    }),
  });

  saveProduct(newProduct: CreateProductDto) {
    this.isSaving.set(true);
    this.productsService.addProduct(newProduct).subscribe({
      next: async () => {
        this.isSaving.set(false);
        this.form.reset();

        const confirmed = await this.modalService.open({
          title: 'Success!',
          message:
            'Product has been added successfully. Would you like to go back to the product list?',
          confirmLabel: 'Yes, go back',
          cancelLabel: 'No, stay here',
          variant: 'info',
        });

        if (confirmed) {
          this.location.back();
        }
      },
      error: async (err) => {
        console.error('[PRODUCT CREATION FAILED] - details: ', err);

        this.isSaving.set(false);
        await this.modalService.open({
          title: 'Failed!',
          message: 'Product has not been added successfully. Please try again. ',
          confirmLabel: 'Try again',
          cancelLabel: '',
          variant: 'danger',
        });
      },
    });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving() === true) {
      return;
    }
    const { name, categoryId, quantity, price } = this.form.getRawValue();

    if (categoryId === null || quantity === null || price === null) {
      return;
    }

    const newProduct: CreateProductDto = {
      name,
      categoryId,
      quantity,
      price,
    };

    this.saveProduct(newProduct);
  }

  onCancel(): void {
    this.location.back();
  }
}

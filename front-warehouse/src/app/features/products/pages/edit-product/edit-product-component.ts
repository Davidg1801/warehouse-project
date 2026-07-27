import { ChangeDetectionStrategy, Component, effect, inject, signal, Signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CategoriesService } from '@features/categories/services/categories.service';
import { EditProductDto } from '@features/products/dtos/edit-product.dto';
import { Category } from '@features/categories/models/category.model';
import { ProductsService } from '@features/products/services/products.service';
import { ModalService } from '@shared/services/modal.service';
import { Location } from '@angular/common';
import { map, of } from 'rxjs';

interface EditProductForm {
  name: FormControl<string>;
  categoryId: FormControl<number | null>;
  quantity: FormControl<number | null>;
  price: FormControl<number | null>;
}

@Component({
  selector: 'app-edit-product-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-product-component.html',
  styleUrl: './edit-product-component.scss',
})
export class EditProductComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly modalService = inject(ModalService);

  readonly isSaving = signal(false);

  readonly uuid = toSignal(this.route.paramMap.pipe(map((params) => params.get('uuid'))), {
    initialValue: null,
  });

  readonly categories: Signal<Category[]> = toSignal(this.categoriesService.getAllCategories(), {
    initialValue: [],
  });

  readonly productResource = rxResource({
    params: () => ({ uuid: this.uuid() }),
    stream: ({ params }) => {
      const uuid = params.uuid;
      return uuid ? this.productsService.getProduct(uuid) : of(null);
    },
  });

  readonly editForm = new FormGroup<EditProductForm>({
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

  constructor() {
    effect(() => {
      const product = this.productResource.value();
      if (product) {
        this.editForm.patchValue(product);
      }
    });
  }

  updateProduct(product: EditProductDto) {
    this.productsService.updateProduct(product).subscribe({
      next: async () => {
        const confirmed = await this.modalService.open({
          title: 'Success!',
          message: `Product ${product.name}  has been updated successfully. Would you like to go back to the product list?`,
          confirmLabel: 'Yes, go back',
          cancelLabel: 'No, stay here',
          variant: 'primary',
        });

        if (confirmed) {
          this.location.back();
        }
      },
      error: async (err) => {
        console.error('Product update failed: ' + err);
        await this.modalService.open({
          title: 'Failed!',
          message: 'Product has not been updated successfully. Please try it again. ',
          confirmLabel: 'Try again',
          cancelLabel: '',
          variant: 'primary',
        });
      },
    });
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const currentUuid = this.uuid();
    if (!currentUuid) return;

    const value = this.editForm.getRawValue();
    const product: EditProductDto = {
      name: value.name,
      categoryId: value.categoryId!,
      quantity: value.quantity!,
      price: value.price!,
      uuid: currentUuid,
    };

    this.updateProduct(product);
  }

  onCancel(): void {
    this.location.back();
  }
}

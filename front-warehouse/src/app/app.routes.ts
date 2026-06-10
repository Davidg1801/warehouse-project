import { Routes } from '@angular/router';
import { canActivateAuthRole } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('@features/products/pages/products-page-component/products-page-component').then(
        (c) => c.ProductsPageComponent,
      ),
    title: 'Products',
    canActivate: [canActivateAuthRole],
  },
  {
    path: 'products/create',
    loadComponent: () =>
      import('@features/products/pages/create-product-component/create-product-component').then(
        (c) => c.CreateProductComponent,
      ),
    title: 'Create product',
    canActivate: [canActivateAuthRole],
  },
  {
    path: 'products/:uuid/edit',
    loadComponent: () =>
      import('@features/products/pages/edit-product-component/edit-product-component').then(
        (c) => c.EditProductComponent,
      ),
    title: 'Edit product',
    // canActivate: [canActivateAuthRole],
  },
];

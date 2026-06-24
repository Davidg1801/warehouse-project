import { Routes } from '@angular/router';
import { canActivateAuthRole } from '@core/auth/auth.guard';
import { PageComponent } from '@layout/components/page/page-component';

export const routes: Routes = [
  {
    path: '',
    component: PageComponent,
    canActivate: [canActivateAuthRole],
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },

      {
        path: 'products',
        loadComponent: () =>
          import('@features/products/pages/products-list/products-list-component').then(
            (c) => c.ProductsListComponent,
          ),
        title: 'Products',
      },

      {
        path: 'products/create',
        loadComponent: () =>
          import('@features/products/pages/create-product/create-product-component').then(
            (c) => c.CreateProductComponent,
          ),
        title: 'Create product',
      },

      {
        path: 'products/:uuid/edit',
        loadComponent: () =>
          import('@features/products/pages/edit-product/edit-product-component').then(
            (c) => c.EditProductComponent,
          ),
        title: 'Edit product',
      },
    ],
  },
];

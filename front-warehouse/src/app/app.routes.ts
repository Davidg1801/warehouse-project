import { Routes } from '@angular/router';

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
  },
];

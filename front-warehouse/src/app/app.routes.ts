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
  {
    path: 'products/create',
    loadComponent: () =>
      import('@features/products/pages/create-product-component/create-product-component').then(
        (c) => c.CreateProductComponent,
      ),
    title: 'Create product',
  },
  {
    path: 'products/123/edit',
    loadComponent: () =>
      import('@features/products/pages/edit-product-component/edit-product-component').then(
        (c) => c.EditProductComponent,
      ),
    title: 'Edit product',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('@features/categories/pages/categories-page-component/categories-page-component').then(
        (c) => c.CategoriesPageComponent,
      ),
    title: 'Categories',
  },
];

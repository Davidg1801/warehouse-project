import { Category } from '@features/categories/models/category.model';
import { Product } from '../models/product.model';

export function mapProductsWithCategoryNames(
  products: Product[],
  categories: Category[],
): Product[] {
  if (products.length === 0) return [];
  if (categories.length === 0) return products;

  const categoriesMap = new Map(categories.map((c) => [c.id, c.name]));

  return products.map((product) => ({
    ...product,
    categoryName: categoriesMap.get(product.categoryId) ?? 'Unknown',
  }));
}

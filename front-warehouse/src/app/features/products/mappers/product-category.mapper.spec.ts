import { Category } from '@features/categories/models/category.model';
import { Product } from '../models/product.model';
import { mapProductsWithCategoryNames } from './/product-category.mapper';

function createProduct(overrides?: Partial<Product>): Product {
  return {
    uuid: '1',
    categoryId: 2,
    name: 'RTX 4070',
    price: 2499,
    quantity: 5,
    ...overrides,
  };
}

function createCategory(overrides?: Partial<Category>): Category {
  return {
    id: 2,
    name: 'Graphics Cards',
    ...overrides,
  };
}

describe('ProductCategoryMapper', () => {
  it('should map category names correctly', () => {
    const products = [createProduct()];
    const categories = [createCategory()];

    const result = mapProductsWithCategoryNames(products, categories);
    expect(result[0].categoryName).toBe('Graphics Cards');
  });

  it('should return empty table if there are no products', () => {
    const categories = [createCategory()];

    const result = mapProductsWithCategoryNames([], categories);
    expect(result).toEqual([]);
  });

  it('should return product table if there are no categories', () => {
    const products = [createProduct()];
    const result = mapProductsWithCategoryNames(products, []);
    expect(result).toEqual(products);
  });
});

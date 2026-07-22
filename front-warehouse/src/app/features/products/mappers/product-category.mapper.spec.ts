import { mapProductsWithCategoryNames } from './/product-category.mapper';

describe('mapProductsWithCategoryNames', () => {
  const mockCategories = [
    {
      id: 1,
      name: 'Processors',
    },
    {
      id: 2,
      name: 'Graphics Cards',
    },
  ];

  const mockProducts = [
    {
      uuid: '1',
      categoryId: 2,
      name: 'RTX 4070',
      price: 2499,
      quantity: 5,
    },
    {
      uuid: '2',
      categoryId: 1,
      name: 'Intel i7-14700K',
      price: 1899,
      quantity: 10,
    },
    {
      uuid: '3',
      categoryId: 99,
      name: 'Uknown item',
      price: 99,
      quantity: 100,
    },
  ];

  it('should map category names correctly', () => {
    const result = mapProductsWithCategoryNames(mockProducts, mockCategories);
    expect(result[0].categoryName).toBe('Graphics Cards');
    expect(result[1].categoryName).toBe('Processors');
    expect(result[2].categoryName).toBe('Others');
  });
});

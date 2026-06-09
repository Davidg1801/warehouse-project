import { ProductDto } from '../dto/product.dto';
import { Product } from '../models/product.model';

export function mapProduct(dto: ProductDto): Product {
  return {
    uuid: dto.uuid,
    categoryId: dto.categoryId,
    name: dto.name,
    price: dto.price,
    quantity: dto.quantity,
  };
}

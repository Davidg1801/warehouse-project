import { ProductDto } from './product.dto';

export interface ProductResponseDto {
  success: boolean;
  message: string;
  errors: string;
  data: ProductDto[];
}

import { Component, input } from '@angular/core';
import { Category } from '@features/categories/models/product.model';

@Component({
  selector: 'app-category-table-component',
  imports: [],
  standalone: true,
  templateUrl: './category-table-component.html',
  styleUrl: './category-table-component.scss',
})
export class CategoryTableComponent {
  categories = input.required<Category[]>();
}

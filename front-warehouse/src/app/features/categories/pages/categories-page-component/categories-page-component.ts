import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryTableComponent } from '@features/categories/components/category-table-component/category-table-component';

@Component({
  selector: 'app-categories-page-component',
  imports: [RouterLink, CategoryTableComponent],
  standalone: true,
  templateUrl: './categories-page-component.html',
  styleUrl: './categories-page-component.scss',
})
export class CategoriesPageComponent {}

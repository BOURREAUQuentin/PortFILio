import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SortOption = 'recent' | 'oldest' | 'alpha' | 'alpha-reverse';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {

  searchTerm: string = '';
  isSortMenuOpen: boolean = false;
  activeSort: SortOption = 'recent';

  @Output() search: EventEmitter<string> = new EventEmitter<string>();
  @Output() sortChange: EventEmitter<SortOption> = new EventEmitter<SortOption>();
  @Output() toggleFilter: EventEmitter<void> = new EventEmitter<void>();

  @Input() placeholder: string = 'Chercher un projet...';

  onSearchChange(): void {
    this.search.emit(this.searchTerm);
  }

  // NOUVELLE MÉTHODE
  resetSearch(): void {
    this.searchTerm = '';
    this.onSearchChange(); // Émet une chaîne vide pour réinitialiser la liste
  }

  toggleSortMenu(): void {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  selectSort(option: SortOption): void {
    this.activeSort = option;
    this.sortChange.emit(option);
    this.isSortMenuOpen = false;
  }

  closeMenu(): void {
    this.isSortMenuOpen = false;
  }

  onFilterClick(): void {
    this.toggleFilter.emit();
  }
}

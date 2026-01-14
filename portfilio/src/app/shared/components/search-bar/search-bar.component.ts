import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Nécessaire pour le [(ngModel)]

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent {

  // Valeur du champ de recherche
  searchTerm: string = '';

  // Événement émis à chaque frappe (pour recherche en temps réel)
  @Output() search: EventEmitter<string> = new EventEmitter<string>();

  // Événements pour les boutons de droite
  @Output() toggleSort: EventEmitter<void> = new EventEmitter<void>();
  @Output() toggleFilter: EventEmitter<void> = new EventEmitter<void>();

  // Placeholder configurable si besoin
  @Input() placeholder: string = 'Chercher un projet...';

  onSearchChange(): void {
    this.search.emit(this.searchTerm);
  }

  onSortClick(): void {
    this.toggleSort.emit();
  }

  onFilterClick(): void {
    this.toggleFilter.emit();
  }
}

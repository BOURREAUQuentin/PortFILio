import { Component, EventEmitter, Output, Input, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service'; // Import Service
import { ProjectFilters } from '../../../core/models/project.model';

export type SortOption = 'default' | 'recent' | 'oldest' | 'az' | 'za';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {

  private projectService = inject(ProjectService); // Injection du service
  private eRef = inject(ElementRef);

  @Input() searchQuery: string = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<SortOption>();
  @Output() filterChange = new EventEmitter<ProjectFilters>();

  // Listes dynamiques (chargées automatiquement)
  availableTags: string[] = [];
  availableModules: string[] = [];
  availablePromos: string[] = [];

  isSortMenuOpen = false;
  isFilterMenuOpen = false;
  currentSortLabel = 'Tri par défaut';

  filters: ProjectFilters = {
    tags: [], modules: [], promos: [],
    sectionsActive: { tags: true, modules: true, promos: true }
  };

  // --- CHARGEMENT AUTOMATIQUE DES DONNÉES ---
  ngOnInit(): void {
    this.projectService.getProjects().subscribe(projects => {
      if (projects) {
        // 1. Tags uniques
        const allTags = projects.flatMap(p => p.tags);
        this.availableTags = [...new Set(allTags)].sort();

        // 2. Modules uniques
        const allModules = projects.flatMap(p => p.modules || []);
        this.availableModules = [...new Set(allModules)].sort();

        // 3. Promos uniques
        const allPromos = projects.map(p => p.promo);
        this.availablePromos = [...new Set(allPromos)].sort();
      }
    });
  }

  // --- CLICK OUTSIDE ---
  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.btn-sort') && !target.closest('.sort-dropdown')) {
      this.isSortMenuOpen = false;
    }
    if (!target.closest('.btn-filter') && !target.closest('.filter-dropdown')) {
      this.isFilterMenuOpen = false;
    }
  }

  // --- RECHERCHE ---
  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchQuery = val;
    this.searchChange.emit(val);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchChange.emit('');
  }

  // --- LOGIQUE FILTRES ---
  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.sectionsActive.tags) count += this.filters.tags.length;
    if (this.filters.sectionsActive.modules) count += this.filters.modules.length;
    if (this.filters.sectionsActive.promos) count += this.filters.promos.length;
    return count;
  }

  toggleFilterMenu(): void {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
    if (this.isFilterMenuOpen) this.isSortMenuOpen = false;
  }

  toggleFilterItem(category: 'tags' | 'modules' | 'promos', item: string): void {
    const list = this.filters[category];
    const index = list.indexOf(item);
    if (index > -1) list.splice(index, 1);
    else list.push(item);
    this.emitFilters();
  }

  isItemChecked(category: 'tags' | 'modules' | 'promos', item: string): boolean {
    return this.filters[category].includes(item);
  }

  toggleSection(section: 'tags' | 'modules' | 'promos'): void {
    this.filters.sectionsActive[section] = !this.filters.sectionsActive[section];
    this.emitFilters();
  }

  resetFilters(): void {
    this.filters.tags = [];
    this.filters.modules = [];
    this.filters.promos = [];
    this.filters.sectionsActive = { tags: true, modules: true, promos: true };
    this.emitFilters();
    this.isFilterMenuOpen = false;
  }

  private emitFilters(): void {
    this.filterChange.emit({ ...this.filters });
  }

  // --- LOGIQUE TRI ---
  toggleSortMenu(): void {
    this.isSortMenuOpen = !this.isSortMenuOpen;
    if (this.isSortMenuOpen) this.isFilterMenuOpen = false;
  }

  selectSort(type: SortOption, label: string): void {
    this.currentSortLabel = label;
    this.sortChange.emit(type);
    this.isSortMenuOpen = false;
  }
}

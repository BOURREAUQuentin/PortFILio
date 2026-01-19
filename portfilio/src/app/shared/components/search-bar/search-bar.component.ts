import { Component, EventEmitter, Output, Input, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
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

  private projectService = inject(ProjectService);
  private eRef = inject(ElementRef);

  @Input() searchQuery: string = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<SortOption>();
  @Output() filterChange = new EventEmitter<ProjectFilters>();

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

  // NOUVEAU : État visuel (ouvert/fermé) des sections
  // Par défaut, on peut les laisser ouvertes ou fermées selon ta préférence
  sectionsExpanded = {
    tags: true,
    modules: false, // Exemple : fermé par défaut pour gagner de la place
    promos: false
  };

  ngOnInit(): void {
    this.projectService.getProjects().subscribe(projects => {
      if (projects) {
        const allTags = projects.flatMap(p => p.tags);
        this.availableTags = [...new Set(allTags)].sort();

        const allModules = projects.flatMap(p => p.modules || []);
        this.availableModules = [...new Set(allModules)].sort();

        const allPromos = projects.map(p => p.promo);
        this.availablePromos = [...new Set(allPromos)].sort();
      }
    });
  }

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

  // --- ACTIONS ---

  // NOUVEAU : Basculer l'affichage d'une section
  toggleExpansion(section: 'tags' | 'modules' | 'promos'): void {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
  }

  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchQuery = val;
    this.searchChange.emit(val);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchChange.emit('');
  }

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

  toggleSection(section: 'tags' | 'modules' | 'promos', event?: Event): void {
    // Si l'event vient du switch, on empêche qu'il déclenche aussi le repli (toggleExpansion)
    if (event) event.stopPropagation();

    this.filters.sectionsActive[section] = !this.filters.sectionsActive[section];
    this.emitFilters();
  }

  resetFilters(): void {
    this.filters.tags = [];
    this.filters.modules = [];
    this.filters.promos = [];
    this.filters.sectionsActive = { tags: true, modules: true, promos: true };
    this.emitFilters();
    // On peut aussi réouvrir toutes les sections au reset si on veut
    this.sectionsExpanded = { tags: true, modules: true, promos: true };
    this.isFilterMenuOpen = false;
  }

  private emitFilters(): void {
    this.filterChange.emit({ ...this.filters });
  }

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

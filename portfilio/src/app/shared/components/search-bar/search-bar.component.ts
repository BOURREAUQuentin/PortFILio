import { Component, EventEmitter, Output, Input, HostListener, ElementRef, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
export class SearchBarComponent implements OnInit, OnChanges {

  private projectService = inject(ProjectService);
  private eRef = inject(ElementRef);

  @Input() searchQuery: string = '';
  // NOUVEAU : On reçoit l'état initial du parent
  @Input() initialFilters: ProjectFilters | null = null;
  @Input() initialSort: string = 'recent';

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

  sectionsExpanded = {
    tags: true,
    modules: false,
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

    // Initialisation Label Tri
    this.updateSortLabel(this.initialSort as SortOption);
  }

  // NOUVEAU : Réagir quand le parent envoie des données sauvegardées
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters'] && this.initialFilters) {
      // Copie profonde pour éviter les références
      this.filters = JSON.parse(JSON.stringify(this.initialFilters));
    }
    if (changes['initialSort']) {
      this.updateSortLabel(this.initialSort as SortOption);
    }
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

  private updateSortLabel(type: SortOption): void {
    const labels: Record<string, string> = {
      'default': 'Tri par défaut',
      'recent': 'Plus récents',
      'oldest': 'Plus anciens',
      'az': 'Alphabétique (A-Z)',
      'za': 'Alphabétique (Z-A)'
    };
    // Mapping si la valeur stockée ne correspond pas exactement
    this.currentSortLabel = labels[type] || 'Tri par défaut';
  }
}

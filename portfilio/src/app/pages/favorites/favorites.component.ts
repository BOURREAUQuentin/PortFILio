import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { SearchBarComponent, SortOption } from '../../shared/components/search-bar/search-bar.component';
import { ProjectService } from '../../core/services/project.service';
import { Project, ProjectFilters } from '../../core/models/project.model';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    ProjectCardComponent,
    SearchBarComponent,
    ConfirmModalComponent,
    RouterLink
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  allFavorites: Project[] = [];
  filteredFavorites: Project[] = [];
  paginatedFavorites: Project[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  // Variables d'état
  currentSearchTerm: string = '';
  currentSortType: SortOption = 'recent';
  currentFilters: ProjectFilters = {
    tags: [], modules: [], promos: [],
    sectionsActive: { tags: true, modules: true, promos: true }
  };

  itemToDeleteId: number | null = null;

  ngOnInit(): void {
    // 1. CHARGEMENT DE L'ÉTAT SAUVEGARDÉ
    const savedState = this.projectService.getFavoritesState();
    this.currentPage = savedState.currentPage;
    this.currentSearchTerm = savedState.searchQuery;
    // On force le cast si nécessaire, selon le typage de sortType dans le service
    this.currentSortType = savedState.sortType as SortOption;
    this.currentFilters = savedState.filters;

    // 2. CHARGEMENT DES DONNÉES
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.allFavorites = data.filter(p => p.isFavorite);
        this.applyGlobalFilters();
      }
    });
  }

  // --- ACTIONS AVEC SAUVEGARDE ---

  onSearch(term: string): void {
    this.currentSearchTerm = term;
    this.currentPage = 1;
    this.saveState();
    this.applyGlobalFilters();
  }

  onSort(sortType: SortOption): void {
    this.currentSortType = sortType;
    this.saveState();
    this.applyGlobalFilters();
  }

  onFilter(filters: ProjectFilters): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.saveState();
    this.applyGlobalFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.saveState();
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Méthode helper pour sauvegarder
  private saveState(): void {
    this.projectService.saveFavoritesState({
      currentPage: this.currentPage,
      searchQuery: this.currentSearchTerm,
      sortType: this.currentSortType,
      filters: this.currentFilters
    });
  }

  // --- LOGIQUE FILTRAGE (Inchangée) ---

  applyGlobalFilters(): void {
    let result = [...this.allFavorites];

    if (this.currentSearchTerm.trim()) {
      const lowerTerm = this.currentSearchTerm.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(lowerTerm));
    }

    if (this.currentFilters.sectionsActive.tags && this.currentFilters.tags.length > 0) {
      result = result.filter(p => p.tags.some(tag => this.currentFilters.tags.includes(tag)));
    }
    if (this.currentFilters.sectionsActive.modules && this.currentFilters.modules.length > 0) {
      result = result.filter(p => (p.modules || []).some(mod => this.currentFilters.modules.includes(mod)));
    }
    if (this.currentFilters.sectionsActive.promos && this.currentFilters.promos.length > 0) {
      result = result.filter(p => this.currentFilters.promos.includes(p.promo));
    }

    switch (this.currentSortType) {
      case 'recent': result.sort((a, b) => b.id - a.id); break;
      case 'oldest': result.sort((a, b) => a.id - b.id); break;
      case 'az': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': result.sort((a, b) => b.title.localeCompare(a.title)); break;
      default: result.sort((a, b) => b.id - a.id);
    }

    this.filteredFavorites = result;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredFavorites.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
      this.saveState();
    }
    if (this.totalPages === 0) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFavorites = this.filteredFavorites.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  initDelete(id: number): void { this.itemToDeleteId = id; }
  cancelDelete(): void { this.itemToDeleteId = null; }
  confirmDelete(): void {
    if (this.itemToDeleteId) {
      this.projectService.toggleFavorite(this.itemToDeleteId);
      this.itemToDeleteId = null;
    }
  }
}

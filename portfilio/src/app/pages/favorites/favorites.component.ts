import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
// IMPORT DU TYPE SortOption ICI
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

  // Données
  allFavorites: Project[] = [];
  filteredFavorites: Project[] = [];
  paginatedFavorites: Project[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  // État Filtres
  currentSearchTerm: string = '';
  currentSortType: SortOption = 'recent'; // Typé correctement maintenant
  currentFilters: ProjectFilters = {
    tags: [], modules: [], promos: [],
    sectionsActive: { tags: true, modules: true, promos: true }
  };

  // Suppression
  itemToDeleteId: number | null = null;

  ngOnInit(): void {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        // On ne garde que les favoris
        this.allFavorites = data.filter(p => p.isFavorite);
        // On applique les filtres initiaux
        this.applyGlobalFilters();
      }
    });
  }

  // --- ACTIONS ---

  onSearch(term: string): void {
    this.currentSearchTerm = term;
    this.currentPage = 1;
    this.applyGlobalFilters();
  }

  onSort(sortType: SortOption): void {
    this.currentSortType = sortType;
    this.applyGlobalFilters();
  }

  onFilter(filters: ProjectFilters): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.applyGlobalFilters();
  }

  // --- CERVEAU CENTRAL (Recherche + Filtres + Tri) ---

  applyGlobalFilters(): void {
    let result = [...this.allFavorites];

    // 1. Recherche Texte
    if (this.currentSearchTerm.trim()) {
      const lowerTerm = this.currentSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filtres Avancés (Tags)
    if (this.currentFilters.sectionsActive.tags && this.currentFilters.tags.length > 0) {
      result = result.filter(p =>
        p.tags.some(tag => this.currentFilters.tags.includes(tag))
      );
    }

    // 3. Filtres Avancés (Modules)
    if (this.currentFilters.sectionsActive.modules && this.currentFilters.modules.length > 0) {
      result = result.filter(p =>
        (p.modules || []).some(mod => this.currentFilters.modules.includes(mod))
      );
    }

    // 4. Filtres Avancés (Promo)
    if (this.currentFilters.sectionsActive.promos && this.currentFilters.promos.length > 0) {
      result = result.filter(p =>
        this.currentFilters.promos.includes(p.promo)
      );
    }

    // 5. Tri (Clés standardisées avec search-bar)
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

  // --- PAGINATION ---

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredFavorites.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    if (this.totalPages === 0) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFavorites = this.filteredFavorites.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get pageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  // --- SUPPRESSION ---

  initDelete(id: number): void {
    this.itemToDeleteId = id;
  }

  cancelDelete(): void {
    this.itemToDeleteId = null;
  }

  confirmDelete(): void {
    if (this.itemToDeleteId) {
      this.projectService.toggleFavorite(this.itemToDeleteId);

      // On retire l'élément de la liste brute
      this.allFavorites = this.allFavorites.filter(p => p.id !== this.itemToDeleteId);

      // On ré-applique tout (filtres, recherche, tri)
      this.applyGlobalFilters();

      this.itemToDeleteId = null;
    }
  }
}

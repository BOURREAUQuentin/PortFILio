import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectService } from '../../core/services/project.service';
import { Project, ProjectFilters } from '../../core/models/project.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SearchBarComponent, ProjectCardComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  paginatedProjects: Project[] = [];
  heroImages: Project[] = [];

  // État initial
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  currentSearchTerm: string = '';
  currentSortType: string = 'recent';
  currentFilters: ProjectFilters = {
    tags: [], modules: [], promos: [],
    sectionsActive: { tags: true, modules: true, promos: true }
  };

  ngOnInit(): void {
    // 1. Récupération de l'état sauvegardé dans le Service
    const savedState = this.projectService.getHomeState();
    this.currentPage = savedState.currentPage;
    this.currentSearchTerm = savedState.searchQuery;
    this.currentSortType = savedState.sortType;
    this.currentFilters = savedState.filters;

    // 2. Chargement des données
    this.projectService.getProjects().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allProjects = data;
          this.heroImages = data.slice(0, 5);
          this.applyGlobalFilters();
        }
      },
      error: (err) => console.error('Erreur chargement', err)
    });
  }

  // --- ACTIONS (Avec Sauvegarde) ---

  onSearch(term: string): void {
    this.currentSearchTerm = term;
    this.currentPage = 1; // Reset page sur recherche
    this.saveState(); // Sauvegarde
    this.applyGlobalFilters();
  }

  onSort(sortType: string): void {
    this.currentSortType = sortType;
    this.saveState(); // Sauvegarde
    this.applyGlobalFilters();
  }

  onFilter(filters: ProjectFilters): void {
    this.currentFilters = filters;
    this.currentPage = 1; // Reset page sur filtre
    this.saveState(); // Sauvegarde
    this.applyGlobalFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.saveState(); // C'est ici que la magie opère pour la pagination !
      this.updatePagination();
      this.scrollToAnchor('projects-anchor');
    }
  }

  // --- LOGIQUE METIER ---

  private saveState(): void {
    this.projectService.saveHomeState({
      currentPage: this.currentPage,
      searchQuery: this.currentSearchTerm,
      sortType: this.currentSortType,
      filters: this.currentFilters
    });
  }

  applyGlobalFilters(): void {
    let result = [...this.allProjects];

    // Recherche
    if (this.currentSearchTerm.trim()) {
      const lowerTerm = this.currentSearchTerm.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(lowerTerm));
    }

    // Filtres
    if (this.currentFilters.sectionsActive.tags && this.currentFilters.tags.length > 0) {
      result = result.filter(p => p.tags.some(tag => this.currentFilters.tags.includes(tag)));
    }
    if (this.currentFilters.sectionsActive.modules && this.currentFilters.modules.length > 0) {
      result = result.filter(p => (p.modules || []).some(mod => this.currentFilters.modules.includes(mod)));
    }
    if (this.currentFilters.sectionsActive.promos && this.currentFilters.promos.length > 0) {
      result = result.filter(p => this.currentFilters.promos.includes(p.promo));
    }

    // Tri
    switch (this.currentSortType) {
      case 'recent': case 'default': result.sort((a, b) => b.id - a.id); break;
      case 'oldest': result.sort((a, b) => a.id - b.id); break;
      case 'az': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': result.sort((a, b) => b.title.localeCompare(a.title)); break;
    }

    this.filteredProjects = result;
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);

    // Si la page sauvegardée est trop grande pour le nouveau filtre, on corrige
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
      this.saveState();
    }
    if (this.totalPages === 0) this.currentPage = 1;

    this.updatePagination();
    this.cdr.detectChanges();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  scrollToAnchor(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 160;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  }

  onToggleFavorite(id: number): void {
    this.projectService.toggleFavorite(id);
  }

  getHeroImageStyle(index: number): string { return `pos-${index}`; }
}

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectService } from '../../core/services/project.service';
import { Project, ProjectFilters } from '../../core/models/project.model'; // Ajout ProjectFilters

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

  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  // --- ÉTAT GLOBAL DES FILTRES ---
  // On stocke les choix actuels ici pour pouvoir les combiner
  currentSearchTerm: string = '';
  currentSortType: string = 'recent'; // Par défaut
  currentFilters: ProjectFilters = {
    tags: [],
    modules: [],
    promos: [],
    sectionsActive: { tags: true, modules: true, promos: true }
  };

  ngOnInit(): void {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allProjects = data;
          this.heroImages = data.slice(0, 5);

          // Initialisation : On lance le filtrage global
          this.applyGlobalFilters();
        }
      },
      error: (err) => console.error('Erreur chargement', err)
    });
  }

  // --- ACTIONS (Déclencheurs) ---

  // 1. Recherche Texte
  onSearch(term: string): void {
    this.currentSearchTerm = term;
    this.currentPage = 1; // Reset page
    this.applyGlobalFilters();
  }

  // 2. Tri
  onSort(sortType: string): void { // J'ai changé le type en string pour être souple
    this.currentSortType = sortType;
    this.applyGlobalFilters();
  }

  // 3. NOUVEAU : Filtres avancés
  onFilter(filters: ProjectFilters): void {
    this.currentFilters = filters;
    this.currentPage = 1; // Reset page
    this.applyGlobalFilters();
  }


  // --- LE CERVEAU (Logique combinée) ---

  applyGlobalFilters(): void {
    // 1. On part toujours de la liste complète
    let result = [...this.allProjects];

    // 2. FILTRE : Recherche Texte
    if (this.currentSearchTerm.trim()) {
      const lowerTerm = this.currentSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(lowerTerm)
      );
    }

    // 3. FILTRE : Critères Avancés (Tags, Modules, Promos)

    // A. Tags (Si section active ET tags sélectionnés)
    if (this.currentFilters.sectionsActive.tags && this.currentFilters.tags.length > 0) {
      result = result.filter(p =>
        // Le projet doit avoir au moins UN des tags sélectionnés
        p.tags.some(tag => this.currentFilters.tags.includes(tag))
      );
    }

    // B. Modules (Si section active ET modules sélectionnés)
    if (this.currentFilters.sectionsActive.modules && this.currentFilters.modules.length > 0) {
      result = result.filter(p =>
        // p.modules peut être undefined dans le JSON, on sécurise avec || []
        (p.modules || []).some(mod => this.currentFilters.modules.includes(mod))
      );
    }

    // C. Promo (Si section active ET promos sélectionnées)
    if (this.currentFilters.sectionsActive.promos && this.currentFilters.promos.length > 0) {
      result = result.filter(p =>
        this.currentFilters.promos.includes(p.promo)
      );
    }

    // 4. TRI
    switch (this.currentSortType) {
      case 'recent': // Plus grand ID = Plus récent
        result.sort((a, b) => b.id - a.id);
        break;
      // Note: J'ai adapté les cas pour correspondre aux valeurs renvoyées par la SearchBar précédente
      case 'default': // Idem recent par défaut
        result.sort((a, b) => b.id - a.id);
        break;
      case 'az': // Alpha A-Z
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za': // Alpha Z-A
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    // 5. MISE À JOUR FINALE
    this.filteredProjects = result;
    this.updatePagination();
    this.cdr.detectChanges();
  }


  // --- PAGINATION (Inchangé) ---
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    // Fix: Si 0 résultats, page 1
    if (this.totalPages === 0) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.scrollToAnchor('projects-anchor');
    }
  }

  get pageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  // --- UTILITAIRES ---
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

  getHeroImageStyle(index: number): string {
    return `pos-${index}`;
  }
}

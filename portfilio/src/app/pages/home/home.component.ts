import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // Ajout ChangeDetectorRef
import { CommonModule, ViewportScroller } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SearchBarComponent, ProjectCardComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef); // Injection du détecteur de changement

  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  paginatedProjects: Project[] = [];
  heroImages: Project[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  ngOnInit(): void {
    // On s'abonne au service (qui est maintenant intelligent)
    this.projectService.getProjects().subscribe({
      next: (data) => {
        // On vérifie qu'on a bien des données
        if (data && data.length > 0) {
          this.allProjects = data;
          this.filteredProjects = data;
          this.heroImages = data.slice(0, 5);

          // Initialisation de la pagination
          this.updatePagination();

          // FORCER LA DETECTION DE CHANGEMENT
          // C'est souvent ça qui manque quand les données ne s'affichent pas au retour
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur chargement', err)
    });
  }

  // --- PAGINATION (Reste inchangée) ---
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
    // Petit fix pour éviter d'être sur la page 2 si on filtre et qu'il n'y a qu'1 page
    if (this.currentPage > this.totalPages) this.currentPage = 1;

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

  // --- ACTIONS ---
  onSearch(term: string): void {
    this.currentPage = 1;
    if (!term.trim()) {
      this.filteredProjects = this.allProjects;
    } else {
      const lowerTerm = term.toLowerCase();
      this.filteredProjects = this.allProjects.filter(p =>
        p.title.toLowerCase().includes(lowerTerm) ||
        p.tags.some(t => t.toLowerCase().includes(lowerTerm))
      );
    }
    this.updatePagination();
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
    // Pas besoin de mettre à jour manuellement ici car le subscribe du ngOnInit
    // va recevoir la nouvelle valeur du service automatiquement !
  }

  getHeroImageStyle(index: number): string {
    return `pos-${index}`;
  }
}

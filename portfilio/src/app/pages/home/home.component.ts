import { Component, OnInit, inject } from '@angular/core';
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

  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  paginatedProjects: Project[] = [];
  heroImages: Project[] = []; // Les 5 images du haut

  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  ngOnInit(): void {
    this.projectService.getProjects().subscribe(data => {
      this.allProjects = data;
      this.filteredProjects = data;
      // IMPORTANT : On prend exactement 5 projets pour l'effet éventail
      this.heroImages = data.slice(0, 5);
      this.updatePagination();
    });
  }

  getHeroImageStyle(index: number): string {
    // Retourne 'pos-0', 'pos-1', 'pos-2' (centre), 'pos-3', 'pos-4'
    return `pos-${index}`;
  }

  // --- PAGINATION ---
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
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
    const p = this.allProjects.find(x => x.id === id);
    if(p) p.isFavorite = !p.isFavorite;
  }
}

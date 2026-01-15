import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Pour le bouton retour
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { SearchBarComponent, SortOption } from '../../shared/components/search-bar/search-bar.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component'; // Import Modal

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    ProjectCardComponent,
    SearchBarComponent,
    ConfirmModalComponent, // Ajout
    RouterLink // Ajout
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
  currentSearchTerm: string = '';

  // État pour la suppression
  itemToDeleteId: number | null = null;

  ngOnInit(): void {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.allFavorites = data.filter(p => p.isFavorite);
        this.filteredFavorites = [...this.allFavorites];
        this.applySort('recent', this.filteredFavorites);
        this.updatePagination();
        this.cdr.detectChanges();
      }
    });
  }

  // --- MODIFICATION ICI : On n'appelle plus le service directement ---
  initDelete(id: number): void {
    this.itemToDeleteId = id; // On ouvre la modal pour cet ID
  }

  cancelDelete(): void {
    this.itemToDeleteId = null; // On ferme la modal
  }

  confirmDelete(): void {
    if (this.itemToDeleteId) {
      // 1. Appel au service (Suppression réelle)
      this.projectService.toggleFavorite(this.itemToDeleteId);

      // 2. Mise à jour locale
      this.allFavorites = this.allFavorites.filter(p => p.id !== this.itemToDeleteId);
      this.onSearch(this.currentSearchTerm);

      // 3. Fermeture modal
      this.itemToDeleteId = null;
    }
  }

  // ... (Le reste : onSearch, onSort, applySort, updatePagination, etc. reste identique)

  onSearch(term: string): void {
    this.currentSearchTerm = term;
    this.currentPage = 1;
    if (!term.trim()) {
      this.filteredFavorites = [...this.allFavorites];
    } else {
      const lowerTerm = term.toLowerCase();
      this.filteredFavorites = this.allFavorites.filter(p =>
        p.title.toLowerCase().includes(lowerTerm) ||
        p.tags.some(t => t.toLowerCase().includes(lowerTerm))
      );
    }
    this.updatePagination();
  }

  onSort(sortType: SortOption): void {
    this.applySort(sortType, this.filteredFavorites);
    this.updatePagination();
  }

  applySort(sortType: string, list: Project[]): void {
    switch (sortType) {
      case 'recent': list.sort((a, b) => b.id - a.id); break;
      case 'oldest': list.sort((a, b) => a.id - b.id); break;
      case 'alpha': list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'alpha-reverse': list.sort((a, b) => b.title.localeCompare(a.title)); break;
    }
  }

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
}

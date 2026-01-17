import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { User } from '../../core/models/user.model';
import { Project } from '../../core/models/project.model';
import {ConfirmModalComponent} from '../../shared/components/confirm-modal/confirm-modal.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ProjectCardComponent, ConfirmModalComponent, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  userProjects: Project[] = [];
  paginatedProjects: Project[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 4;
  totalPages: number = 1;

  projectToDeleteId: number | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.loadUserProjects();
      }
    });
  }

  loadUserProjects(): void {
    if (!this.currentUser) return;

    this.projectService.getProjects().subscribe(projects => {
      // FILTRAGE ROBUSTE PAR ID
      // On garde le projet si l'ID de l'utilisateur connecté est présent dans la liste des auteurs
      this.userProjects = projects.filter(p =>
        p.authors.some(author => author.id === this.currentUser?.id)
      );

      this.updatePagination();
      this.cdr.detectChanges();
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.userProjects.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    if (this.totalPages === 0) this.currentPage = 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProjects = this.userProjects.slice(startIndex, endIndex);
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

  get userDescription(): string {
    return this.currentUser?.description || "Aucune description renseignée pour le moment.";
  }

  // Favori direct (pas de popup, juste toggle)
  onToggleFavorite(projectId: number): void {
    this.projectService.toggleFavorite(projectId);
    // Le service met à jour l'observable, donc la vue se rafraîchit toute seule
    // Si tu veux voir le changement de couleur instantané, c'est géré par [class.active] dans le template card
  }

  onEditProject(projectId: number): void {
    console.log("Modifier projet", projectId);
    // Plus tard : this.router.navigate(['/edit-project', projectId]);
  }

  // 1. DÉCLENCHE L'OUVERTURE DE LA POPUP
  onDeleteRequest(projectId: number): void {
    this.projectToDeleteId = projectId;
  }

  // 2. ANNULATION (Ferme la popup)
  cancelDelete(): void {
    this.projectToDeleteId = null;
  }

  // 3. CONFIRMATION RÉELLE
  confirmDelete(): void {
    if (this.projectToDeleteId) {
      // Appel au service pour supprimer
      this.projectService.deleteProject(this.projectToDeleteId);

      // On recharge la liste locale pour voir la disparition
      this.loadUserProjects();

      // On ferme la popup
      this.projectToDeleteId = null;
    }
  }
}

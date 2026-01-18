import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { User } from '../../core/models/user.model';
import { Project } from '../../core/models/project.model';
import {ToastService} from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ProjectCardComponent,
    ConfirmModalComponent,
    AvatarComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  profileUser: User | null = null;

  userProjects: Project[] = [];
  paginatedProjects: Project[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 4;
  totalPages: number = 1;

  projectToDeleteId: number | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam) {
        const id = Number(idParam);
        this.profileUser = this.authService.getUserById(id) || null;
      } else {
        this.profileUser = this.currentUser;
      }

      if (!this.profileUser) {
        this.toastService.show("Utilisateur introuvable.", "error");
        this.router.navigate(['/']);
        return;
      }

      this.loadUserProjects();
    });
  }

  // --- GETTERS ---

  get isOwnProfile(): boolean {
    return this.currentUser?.id === this.profileUser?.id;
  }

  get userFullName(): string {
    return this.profileUser ? `${this.profileUser.firstName} ${this.profileUser.lastName}` : '';
  }

  get userDescription(): string {
    return this.profileUser?.description || "Aucune description renseignée pour le moment.";
  }

  // NOUVEAU : Texte pour le header "Profil de Prénom"
  get headerBackTitle(): string {
    return this.profileUser ? `Profil de ${this.profileUser.firstName}` : 'Retour';
  }

  get pageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  // --- LOGIQUE ---

  loadUserProjects(): void {
    if (!this.profileUser) return;

    this.projectService.getProjects().subscribe(projects => {
      this.userProjects = projects.filter(p =>
        p.authors.some(author => Number(author.id) === this.profileUser?.id)
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

  // --- ACTIONS ---

  onToggleFavorite(projectId: number): void {
    this.projectService.toggleFavorite(projectId);
  }

  onEditProject(projectId: number): void {
    if (this.isOwnProfile) {
      this.router.navigate(['/edit-project', projectId]);
    }
  }

  onDeleteRequest(projectId: number): void {
    if (this.isOwnProfile) {
      this.projectToDeleteId = projectId;
    }
  }

  cancelDelete(): void {
    this.projectToDeleteId = null;
  }

  confirmDelete(): void {
    if (this.projectToDeleteId) {
      this.projectService.deleteProject(this.projectToDeleteId);
      this.loadUserProjects();
      this.projectToDeleteId = null;
    }
  }
}

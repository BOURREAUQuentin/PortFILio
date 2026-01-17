import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { CollapsibleSectionComponent } from '../../shared/components/collapsible-section/collapsible-section.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    AvatarComponent,
    CollapsibleSectionComponent,
    ConfirmModalComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  project: Project | null = null;
  currentUser = this.authService.getCurrentUser(); // Pour savoir si on peut éditer

  // Etats Menu
  isMenuOpen = false;
  isDeleteModalOpen = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.projectService.getProjects().subscribe(projects => {
        // On simule un "getById" via le tableau complet (optimisable coté service)
        this.project = projects.find(p => p.id === id) || null;
      });
    }
  }

  // --- GETTERS ---
  get isEditable(): boolean {
    // Si l'utilisateur courant est dans les auteurs
    if (!this.project || !this.currentUser) return false;
    return this.project.authors.some(a => a.id === this.currentUser?.id);
  }

  // --- ACTIONS ---

  toggleFavorite(): void {
    if (this.project) {
      this.projectService.toggleFavorite(this.project.id);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Edit / Delete logic
  onEdit(): void {
    this.isMenuOpen = false;
    console.log('Edit project', this.project?.id);
    // this.router.navigate(['/edit-project', this.project?.id]);
  }

  onDeleteRequest(): void {
    this.isMenuOpen = false;
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    if (this.project) {
      this.projectService.deleteProject(this.project.id);
      this.isDeleteModalOpen = false;
      this.router.navigate(['/profile']); // Retour profil après suppr
    }
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
  }
}

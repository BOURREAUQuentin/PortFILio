import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    ConfirmModalComponent,
    RouterLink
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
  currentUser = this.authService.getCurrentUser();

  // Etats Menu & Modal Suppression
  isMenuOpen = false;
  isDeleteModalOpen = false;

  // --- ETATS LIGHTBOX (CAROUSEL) ---
  isLightboxOpen = false;
  currentLightboxIndex = 0;
  allImages: string[] = []; // Contiendra [MainImage, ...AdditionalImages]

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.projectService.getProjects().subscribe(projects => {
        this.project = projects.find(p => p.id === id) || null;

        // Préparation du tableau d'images pour le carousel
        if (this.project) {
          this.allImages = [this.project.imageUrl];
          if (this.project.additionalImages) {
            this.allImages.push(...this.project.additionalImages);
          }
        }
      });
    }
  }

  // --- GETTERS ---
  get isEditable(): boolean {
    if (!this.project || !this.currentUser) return false;
    return this.project.authors.some(a => a.id === this.currentUser?.id);
  }

  // --- ACTIONS PROJET ---
  toggleFavorite(): void {
    if (this.project) this.projectService.toggleFavorite(this.project.id);
  }

  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }

  onEdit(): void {
    this.isMenuOpen = false;
    this.router.navigate(['/edit-project', this.project?.id]);
  }

  onDeleteRequest(): void {
    this.isMenuOpen = false;
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    if (this.project) {
      this.projectService.deleteProject(this.project.id);
      this.isDeleteModalOpen = false;
      this.router.navigate(['/profile']);
    }
  }

  cancelDelete(): void { this.isDeleteModalOpen = false; }

  // --- ACTIONS LIGHTBOX ---

  openLightbox(index: number): void {
    this.currentLightboxIndex = index;
    this.isLightboxOpen = true;
    // On bloque le scroll de la page derrière
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
    document.body.style.overflow = ''; // On réactive le scroll
  }

  nextImage(event?: Event): void {
    event?.stopPropagation();
    // Sécurité : ne rien faire s'il n'y a qu'une image
    if (this.allImages.length <= 1) return;

    if (this.currentLightboxIndex < this.allImages.length - 1) {
      this.currentLightboxIndex++;
    } else {
      this.currentLightboxIndex = 0; // Boucle
    }
  }

  prevImage(event?: Event): void {
    event?.stopPropagation();
    // Sécurité : ne rien faire s'il n'y a qu'une image
    if (this.allImages.length <= 1) return;

    if (this.currentLightboxIndex > 0) {
      this.currentLightboxIndex--;
    } else {
      this.currentLightboxIndex = this.allImages.length - 1; // Boucle
    }
  }

  // Gestion Clavier (Flèches + Echap)
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isLightboxOpen) return;

    if (event.key === 'Escape') this.closeLightbox();

    // On ne permet la navigation clavier que s'il y a plusieurs images
    if (this.allImages.length > 1) {
      if (event.key === 'ArrowRight') this.nextImage();
      if (event.key === 'ArrowLeft') this.prevImage();
    }
  }
}

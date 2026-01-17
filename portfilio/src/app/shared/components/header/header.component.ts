import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

export type HeaderVariant = 'default' | 'auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() variant: HeaderVariant = 'default';

  // NOUVEAU : Gestion du retour arrière
  @Input() showBack: boolean = false;
  @Input() backTitle: string = 'Retour'; // Texte par défaut

  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  currentUser: User | null = null;
  isProfileMenuOpen: boolean = false; // État du menu profil

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  goBack(): void {
    this.location.back();
  }

  // Gère le clic sur les boutons d'action génériques
  handleAction(route: string): void {
    if (this.currentUser) {
      this.router.navigate([route]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Gère spécifiquement le clic sur l'icône Profil
  handleProfileClick(): void {
    if (this.currentUser) {
      // Si connecté : on ouvre/ferme le menu
      this.isProfileMenuOpen = !this.isProfileMenuOpen;
    } else {
      // Si pas connecté : redirection login
      this.router.navigate(['/login']);
    }
  }

  closeMenu(): void {
    this.isProfileMenuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.closeMenu();
  }
}

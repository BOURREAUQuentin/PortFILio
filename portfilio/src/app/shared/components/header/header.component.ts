import { Component, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Location pour le bouton retour
import { RouterLink } from '@angular/router';

export type HeaderVariant = 'default' | 'auth' | 'detail';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Par défaut, on affiche la version classique
  @Input() variant: HeaderVariant = 'default';

  // Titre optionnel (uniquement pour la variante 'detail')
  @Input() projectTitle: string = '';

  constructor(private location: Location) {}

  // Fonction pour revenir en arrière (utilisée par la flèche du titre)
  goBack(): void {
    this.location.back();
  }
}

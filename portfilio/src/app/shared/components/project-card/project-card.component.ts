import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project } from '../../../core/models/project.model'; // Assure-toi que le chemin est bon

export type CardVariant = 'normal' | 'small';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss'
})
export class ProjectCardComponent {

  @Input({ required: true }) project!: Project;
  @Input() variant: CardVariant = 'normal';

  // Événement pour le toggle favori
  @Output() toggleFavorite = new EventEmitter<number>();

  // Helper pour savoir si c'est un groupe
  get isGroup(): boolean {
    return this.project.authors.length > 1;
  }

  // Helper pour obtenir le nom à afficher (Prénom seul OU "X personnes")
  get authorLabel(): string {
    if (this.isGroup) {
      return `${this.project.authors.length} personnes`;
    }
    return this.project.authors[0].name;
  }

  // Gestion du clic sur le coeur (empêche d'ouvrir le projet)
  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleFavorite.emit(this.project.id);
  }
}

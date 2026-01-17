import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Project } from '../../../core/models/project.model';
import {AvatarComponent} from '../avatar/avatar.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss']
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() variant: 'normal' | 'small' = 'normal';
  @Input() isEditable: boolean = false;

  @Output() toggleFavorite = new EventEmitter<number>();
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  // État du menu déroulant
  isMenuOpen: boolean = false;

  get isGroup(): boolean { return this.project.authors.length > 1; }
  get authorLabel(): string {
    if (this.isGroup) return `${this.project.authors.length} participants`;
    return this.project.authors[0].name;
  }

  // --- ACTIONS ---

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.toggleFavorite.emit(this.project.id);
  }

  // Gestion du menu 3 points
  onMenuToggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(event?: Event): void {
    if(event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isMenuOpen = false;
  }

  onEditClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.edit.emit(this.project.id);
    this.isMenuOpen = false; // Ferme après action
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.delete.emit(this.project.id);
    this.isMenuOpen = false; // Ferme après action
  }
}

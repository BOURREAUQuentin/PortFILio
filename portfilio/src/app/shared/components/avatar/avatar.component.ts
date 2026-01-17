import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnChanges {
  @Input() imageUrl?: string | null = null;
  @Input() name: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  initials: string = '';
  // Une couleur de fond fixe pour les initiales (ex: ton orange, ou un gris foncé)
  backgroundColor: string = '#A63A0F';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name']) {
      this.calculateInitials();
    }
  }

  private calculateInitials(): void {
    if (!this.name) {
      this.initials = '';
      return;
    }
    const parts = this.name.trim().split(' ');
    if (parts.length === 1) {
      // Juste le prénom : "Jules" -> "J"
      this.initials = parts[0].charAt(0).toUpperCase();
    } else if (parts.length >= 2) {
      // Prénom + Nom : "Jules Pomme" -> "JP"
      this.initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
  }
}

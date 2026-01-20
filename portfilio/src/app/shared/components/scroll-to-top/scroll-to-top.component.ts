import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-to-top.component.html',
  styleUrls: ['./scroll-to-top.component.scss']
})
export class ScrollToTopComponent {

  isVisible = false;

  // Écoute le scroll global de la fenêtre
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Si on a défilé de plus de 300px, on affiche le bouton
    this.isVisible = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Défilement doux
    });
  }
}

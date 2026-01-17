import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collapsible-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collapsible-section.component.html',
  styleUrl: './collapsible-section.component.scss'
})
export class CollapsibleSectionComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserLink } from '../../core/models/user.model';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule, HeaderComponent],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  currentUser: User | null = null;
  profileForm!: FormGroup;

  // Liste des réseaux supportés
  readonly linkTypes = [
    { value: 'linkedin', label: 'LinkedIn', icon: 'assets/icons/linkedin.svg' }, // ou SVG inline plus tard
    { value: 'github', label: 'GitHub', icon: 'assets/icons/github.svg' },
    { value: 'instagram', label: 'Instagram', icon: 'assets/icons/instagram.svg' },
    { value: 'website', label: 'Site Web', icon: 'assets/icons/globe.svg' },
    { value: 'portfolio', label: 'Portfolio', icon: 'assets/icons/briefcase.svg' }
  ];

  ngOnInit(): void {
    // 1. Initialisation du formulaire vide
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      description: [''],
      links: this.fb.array([]) // Liste dynamique
    });

    // 2. Remplissage avec les données actuelles
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          description: user.description || ''
        });

        // Reset des liens existants dans le formulaire
        this.linksArray.clear();
        if (user.links) {
          user.links.forEach(link => this.addLink(link));
        }
      }
    });
  }

  // --- GETTERS ---
  get linksArray(): FormArray {
    return this.profileForm.get('links') as FormArray;
  }

  // --- GESTION DES LIENS ---

  // Ajoute une ligne (vide ou pré-remplie)
  addLink(data?: UserLink): void {
    const group = this.fb.group({
      type: [data?.type || '', Validators.required],
      url: [data?.url || '', Validators.required]
    });
    this.linksArray.push(group);
  }

  removeLink(index: number): void {
    this.linksArray.removeAt(index);
  }

  // Logique Drag & Drop pour réordonner
  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.linksArray.controls, event.previousIndex, event.currentIndex);
    // On doit aussi mettre à jour la valeur brute du FormArray pour que Angular s'y retrouve
    this.linksArray.updateValueAndValidity();
  }

  // --- LOGIQUE INTELLIGENTE (FILTRE) ---

  // Retourne la liste des types disponibles pour une ligne donnée
  // (Exclut ceux déjà sélectionnés AILLEURS, mais garde celui de la ligne actuelle)
  getAvailableTypes(currentIndex: number): any[] {
    const selectedTypes = this.linksArray.value.map((l: any) => l.type);

    return this.linkTypes.filter(type => {
      // On garde le type s'il n'est pas utilisé OU s'il est celui de la ligne en cours
      const currentLineType = this.linksArray.at(currentIndex).get('type')?.value;
      return !selectedTypes.includes(type.value) || type.value === currentLineType;
    });
  }

  // --- SOUMISSION ---

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.toastService.show('Veuillez remplir tous les champs obligatoires (*)', 'error');
      this.profileForm.markAllAsTouched(); // Affiche les erreurs rouges
      return;
    }

    if (!this.currentUser) return;

    // Construction de l'objet User mis à jour
    const formValue = this.profileForm.value;

    const updatedUser: User = {
      ...this.currentUser,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      description: formValue.description,
      links: formValue.links // Le tableau est déjà dans le bon format
    };

    // Sauvegarde + Redirection
    this.authService.updateUser(updatedUser);
    this.toastService.show('Profil mis à jour avec succès !', 'success');
    this.router.navigate(['/profile']);
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }
}

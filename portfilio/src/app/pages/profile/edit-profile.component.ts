import {Component, OnInit, inject, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserLink } from '../../core/models/user.model';
import { HeaderComponent } from '../../shared/components/header/header.component';
import {AvatarComponent} from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule, HeaderComponent, AvatarComponent],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  profileForm!: FormGroup;

  // NOUVEAU : Pour stocker l'URL Base64 temporaire de la nouvelle image
  tempAvatarUrl: string | null = null;

  // Helper pour le nom complet dans le template
  get userFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  // Limite de taille (ex: 2MB)
  readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  // Liste des réseaux supportés
  readonly linkTypes = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'github', label: 'GitHub' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'website', label: 'Site Web' },
    { value: 'portfolio', label: 'Portfolio' }
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

  // --- GESTION IMAGE ---

  onRemoveAvatar(): void {
    // On marque pour suppression en mettant une chaîne vide
    this.tempAvatarUrl = '';
    // Si un fichier était sélectionné dans l'input, on le reset
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 1. Validations basiques
    if (!file.type.startsWith('image/')) {
      this.toastService.show("Veuillez sélectionner un fichier image valide.", "error");
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.toastService.show("L'image est trop volumineuse (Max 2Mo).", "error");
      return;
    }

    // 2. Lecture du fichier et conversion en Base64
    const reader = new FileReader();

    reader.onload = (e: any) => {
      // Le résultat est une chaîne Base64 (data:image/png;base64,...)
      this.tempAvatarUrl = e.target.result;

      // Force la détection de changement pour afficher la preview
      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file); // Lance la lecture
  }

  // --- SOUMISSION ---

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.toastService.show('Veuillez remplir tous les champs obligatoires (*)', 'error');
      this.profileForm.markAllAsTouched(); // Affiche les erreurs rouges
      return;
    }

    if (!this.currentUser) return;

    const formValue = this.profileForm.value;

    // 1. Par défaut, on garde l'URL actuelle.
    let finalAvatarUrl = this.currentUser.avatarUrl;

    // 2. Si tempAvatarUrl n'est PAS null, ça veut dire qu'on y a touché.
    //    Que ce soit une nouvelle image ('data:...') OU une suppression (''), on prend cette valeur.
    if (this.tempAvatarUrl !== null) {
      finalAvatarUrl = this.tempAvatarUrl;
    }

    const updatedUser: User = {
      ...this.currentUser,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      description: formValue.description,
      links: formValue.links,
      avatarUrl: finalAvatarUrl // On utilise l'URL calculée ci-dessus
    };

    this.authService.updateUser(updatedUser);
    this.toastService.show('Profil mis à jour avec succès !', 'success');
    this.router.navigate(['/profile']);
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }
}

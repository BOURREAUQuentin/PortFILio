import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, AvatarComponent, ConfirmModalComponent],
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

  tempAvatarUrl: string | null = null;
  readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  // Liste des réseaux supportés
  readonly linkTypes = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'github', label: 'GitHub' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'website', label: 'Site Web' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'twitter', label: 'Twitter/X' }
  ];

  // Gestion Navigation / Modal
  showCancelModal = false;
  private navigationSubject: Subject<boolean> | null = null;

  // Gestion Drag & Drop
  draggedLinkIndex: number | null = null;

  get userFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      description: [''],
      links: this.fb.array([])
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          description: user.description || ''
        });

        this.linksArray.clear();
        if (user.links && user.links.length > 0) {
          user.links.forEach(link => this.addLink(link.type, link.url));
        } else {
          // Un lien vide par défaut
          this.addLink();
        }
      }
    });
  }

  // --- GUARD (PROTECTION SORTIE) ---
  canDeactivate(): Observable<boolean> | boolean {
    if (!this.profileForm.dirty) return true;
    this.showCancelModal = true;
    this.navigationSubject = new Subject<boolean>();
    return this.navigationSubject.asObservable();
  }

  confirmCancel(): void {
    this.showCancelModal = false;
    // On force le reset pour que le Guard laisse passer la navigation suivante
    this.profileForm.reset();

    if (this.navigationSubject) {
      this.navigationSubject.next(true); // Autorise la navigation en attente
      this.navigationSubject.complete();
    } else {
      // Cas où on a cliqué sur le bouton Annuler du formulaire
      this.router.navigate(['/profile']);
    }
  }

  closeModal(): void {
    this.showCancelModal = false;
    if (this.navigationSubject) {
      this.navigationSubject.next(false); // Bloque la navigation
      this.navigationSubject.complete();
      this.navigationSubject = null; // Reset
    }
  }

  requestCancel(): void {
    if (this.profileForm.dirty) {
      this.showCancelModal = true;
    } else {
      this.router.navigate(['/profile']);
    }
  }

  // --- GESTION DES LIENS ---
  get linksArray(): FormArray {
    return this.profileForm.get('links') as FormArray;
  }

  // Validateur conditionnel : URL requise si Type rempli
  linkValidator(control: AbstractControl): ValidationErrors | null {
    const type = control.get('type')?.value;
    const url = control.get('url')?.value;
    if (type && !url) {
      control.get('url')?.setErrors({ required: true });
      return { urlMissing: true };
    }
    control.get('url')?.setErrors(null);
    return null;
  }

  addLink(type: string = '', url: string = ''): void {
    const group = this.fb.group({
      type: [type],
      url: [url]
    }, { validators: this.linkValidator });
    this.linksArray.push(group);
  }

  removeLink(index: number): void {
    this.linksArray.removeAt(index);
    this.profileForm.markAsDirty(); // IMPORTANT
  }

  // Drag & Drop Natif
  onLinkDragStart(index: number): void { this.draggedLinkIndex = index; }
  onLinkDragOver(event: DragEvent): void { event.preventDefault(); }
  onLinkDrop(index: number): void {
    if (this.draggedLinkIndex !== null && this.draggedLinkIndex !== index) {
      const currentGroup = this.linksArray.at(this.draggedLinkIndex);
      this.linksArray.removeAt(this.draggedLinkIndex);
      this.linksArray.insert(index, currentGroup);
      this.profileForm.markAsDirty(); // IMPORTANT
    }
    this.draggedLinkIndex = null;
  }

  // --- GESTION IMAGE ---
  onRemoveAvatar(): void {
    this.tempAvatarUrl = '';
    this.profileForm.markAsDirty(); // IMPORTANT
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.toastService.show("Format image invalide.", "error");
      return;
    }

    this.compressImage(file).then(base64 => {
      this.tempAvatarUrl = base64;
      this.profileForm.markAsDirty(); // IMPORTANT
      this.cdr.markForCheck();
    }).catch(() => {
      this.toastService.show("Erreur lors du traitement de l'image.", "error");
    });
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 500;
          const scale = max / img.width;
          canvas.width = max;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  // --- SOUMISSION ---
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.toastService.show('Veuillez remplir les champs obligatoires (*)', 'error');
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) return;

    const formValue = this.profileForm.value;

    // Gestion Image
    let finalAvatarUrl = this.currentUser.avatarUrl;
    if (this.tempAvatarUrl !== null) {
      finalAvatarUrl = this.tempAvatarUrl;
    }

    // Filtrer liens valides (ceux qui ont un type ET une url)
    const validLinks = formValue.links.filter((l: any) => l.type && l.url);

    const updatedUser: User = {
      ...this.currentUser,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      description: formValue.description,
      links: validLinks,
      avatarUrl: finalAvatarUrl
    };

    try {
      this.authService.updateUser(updatedUser);
      // Reset pour passer le Guard
      this.profileForm.reset(formValue);
      this.toastService.show('Profil mis à jour avec succès !', 'success');
      this.router.navigate(['/profile']);
    } catch (e) {
      this.toastService.show('Erreur sauvegarde (Stockage plein ?)', 'error');
    }
  }
}

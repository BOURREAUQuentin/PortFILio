import { Component, OnInit, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Project } from '../../core/models/project.model';
import { User } from '../../core/models/user.model';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, ConfirmModalComponent],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private el = inject(ElementRef);

  projectForm!: FormGroup;
  isEditMode = false;
  projectId: number | null = null;
  currentUser: User | null = null;

  existingTags: string[] = [];
  filteredTags: string[] = [];
  existingModules: string[] = [];
  filteredModules: string[] = [];
  allUsers: User[] = [];
  filteredUsers: User[] = [];

  promos = ['A1', 'A2', 'A3'];
  linkTypes = ['Site Web', 'GitHub', 'Figma', 'Slides', 'Instagram', 'Autre'];

  showCancelModal = false;
  draggedImageIndex: number | null = null;
  draggedLinkIndex: number | null = null;

  private navigationSubject: Subject<boolean> | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.existingTags = this.projectService.getAllTags();
    this.existingModules = this.projectService.getAllModules();

    const usersRaw = localStorage.getItem('portfilio_users');
    if (usersRaw) this.allUsers = JSON.parse(usersRaw);
    if (!this.allUsers || this.allUsers.length === 0) {
      if (this.currentUser) this.allUsers = [this.currentUser];
    }

    this.initForm();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.projectId = Number(id);
        this.loadProjectData(this.projectId);
      } else {
        if (this.currentUser) this.addAuthor(this.currentUser);
        this.addLink();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.js-tags-autocomplete')) this.filteredTags = [];
    if (!target.closest('.js-modules-autocomplete')) this.filteredModules = [];
    if (!target.closest('.js-authors-autocomplete')) this.filteredUsers = [];
  }

  // --- GUARD ---
  canDeactivate(): Observable<boolean> | boolean {
    if (!this.projectForm.dirty) return true;
    this.showCancelModal = true;
    this.navigationSubject = new Subject<boolean>();
    return this.navigationSubject.asObservable();
  }

  confirmCancel(): void {
    this.showCancelModal = false;
    if (this.navigationSubject) {
      this.navigationSubject.next(true);
      this.navigationSubject.complete();
      this.navigationSubject = null;
    }
  }

  closeModal(): void {
    this.showCancelModal = false;
    if (this.navigationSubject) {
      this.navigationSubject.next(false);
      this.navigationSubject.complete();
      this.navigationSubject = null;
    }
  }

  requestCancel(): void {
    this.router.navigate(['/profile']);
  }

  private initForm(): void {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      images: this.fb.array([], [Validators.maxLength(5)]),
      tags: this.fb.array([], Validators.required),
      modules: this.fb.array([]),
      authors: this.fb.array([], Validators.required),
      origin: ['', Validators.required],
      promo: ['A1', Validators.required],
      skillsLearned: ['', Validators.required],
      links: this.fb.array([])
    });
  }

  loadProjectData(id: number): void {
    this.projectService.getProjects().subscribe(projects => {
      const project = projects.find(p => p.id === id);
      if (project) {
        this.projectForm.patchValue({
          title: project.title,
          description: project.description,
          origin: project.origin,
          promo: project.promo,
          skillsLearned: project.skillsLearned
        });

        if (project.tags) project.tags.filter(t => t).forEach(t => this.addTag(t));
        if (project.modules) project.modules.filter(m => m).forEach(m => this.addModule(m));

        this.addImage(project.imageUrl);
        project.additionalImages?.forEach(img => this.addImage(img));

        (this.projectForm.get('authors') as FormArray).clear();
        project.authors.forEach(a => {
          const fullUser = this.allUsers.find(u => u.id == a.id);
          if (fullUser) this.addAuthor(fullUser);
          else this.authorsArr.push(this.fb.control({ ...a, firstName: a.name.split(' ')[0], lastName: a.name.split(' ')[1] || '' }));
        });

        if (project.links && project.links.length > 0) {
          project.links.forEach(l => this.addLink(l.title, l.url));
        } else {
          this.addLink();
        }
      }
    });
  }

  get imagesArr() { return this.projectForm.get('images') as FormArray; }
  get tagsArr() { return this.projectForm.get('tags') as FormArray; }
  get modulesArr() { return this.projectForm.get('modules') as FormArray; }
  get authorsArr() { return this.projectForm.get('authors') as FormArray; }
  get linksArr() { return this.projectForm.get('links') as FormArray; }

  triggerImageUpload(): void {
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    fileInput.click();
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.imagesArr.length < 5) {
      this.compressImage(file).then(base64 => {
        this.addImage(base64);
        this.projectForm.markAsDirty();
      }).catch(err => {
        console.error(err);
        this.toastService.show("Erreur image", "error");
      });
    }
  }
  private compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 800;
          const scale = max / img.width;
          canvas.width = max;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  }
  addImage(url: string): void {
    if (this.imagesArr.length < 5) this.imagesArr.push(this.fb.control(url));
  }
  removeImage(index: number): void {
    this.imagesArr.removeAt(index);
    this.projectForm.markAsDirty();
  }
  onImgDragStart(index: number): void { this.draggedImageIndex = index; }
  onImgDragOver(event: DragEvent): void { event.preventDefault(); }
  onImgDrop(index: number): void {
    if (this.draggedImageIndex !== null && this.draggedImageIndex !== index) {
      const current = this.imagesArr.at(this.draggedImageIndex);
      this.imagesArr.removeAt(this.draggedImageIndex);
      this.imagesArr.insert(index, current);
      this.projectForm.markAsDirty();
    }
    this.draggedImageIndex = null;
  }

  // --- TAGS, MODULES, AUTEURS, LIENS ---
  // (Je garde ces méthodes compressées car elles ne changent pas, pour raccourcir la réponse)
  onTagInput(event: any): void { this.filteredTags = this.existingTags.filter(t => t.toLowerCase().includes(event.target.value?.toLowerCase() || '')); }
  addTag(val: string, input?: HTMLInputElement): void {
    const v = val?.trim();
    if(v && !this.tagsArr.value.some((t: string) => t.toLowerCase() === v.toLowerCase())) { this.tagsArr.push(this.fb.control(v)); this.projectForm.markAsDirty(); }
    if(input) input.value = ''; this.filteredTags = [];
  }
  removeTag(index: number): void { this.tagsArr.removeAt(index); this.projectForm.markAsDirty(); }

  onModuleInput(event: any): void { this.filteredModules = this.existingModules.filter(m => m.toLowerCase().includes(event.target.value?.toLowerCase() || '')); }
  addModule(val: string, input?: HTMLInputElement): void {
    const v = val?.trim();
    if(v && !this.modulesArr.value.some((m: string) => m.toLowerCase() === v.toLowerCase())) { this.modulesArr.push(this.fb.control(v)); this.projectForm.markAsDirty(); }
    if(input) input.value = ''; this.filteredModules = [];
  }
  removeModule(index: number): void { this.modulesArr.removeAt(index); this.projectForm.markAsDirty(); }

  onAuthorInput(event: any): void {
    const val = event.target.value.toLowerCase();
    this.filteredUsers = this.allUsers.filter(u => !this.authorsArr.value.some((a: User) => a.id === u.id) && (u.firstName.toLowerCase().includes(val) || u.lastName.toLowerCase().includes(val)));
  }
  onAuthorEnter(event: Event, input: HTMLInputElement): void { event.preventDefault(); event.stopPropagation(); if(this.filteredUsers.length) this.addAuthor(this.filteredUsers[0], input); }
  addAuthor(user: User, input?: HTMLInputElement): void { if(!this.authorsArr.value.some((a: User) => a.id === user.id)) { this.authorsArr.push(this.fb.control(user)); this.projectForm.markAsDirty(); } if(input) input.value = ''; this.filteredUsers = []; }
  removeAuthor(index: number): void { if(this.authorsArr.length > 1) { this.authorsArr.removeAt(index); this.projectForm.markAsDirty(); } else { this.toastService.show("Le projet doit avoir au moins un auteur.", "error"); } }

  linkValidator(control: AbstractControl): ValidationErrors | null { const title = control.get('title')?.value; const url = control.get('url')?.value; if (title && !url) { control.get('url')?.setErrors({ required: true }); return { urlMissing: true }; } control.get('url')?.setErrors(null); return null; }
  addLink(title: string = '', url: string = ''): void { const group = this.fb.group({ title: [title], url: [url] }, { validators: this.linkValidator }); this.linksArr.push(group); }
  removeLink(index: number): void { this.linksArr.removeAt(index); this.projectForm.markAsDirty(); }
  onLinkDragStart(index: number): void { this.draggedLinkIndex = index; }
  onLinkDragOver(event: DragEvent): void { event.preventDefault(); }
  onLinkDrop(index: number): void { if(this.draggedLinkIndex !== null && this.draggedLinkIndex !== index) { const c = this.linksArr.at(this.draggedLinkIndex); this.linksArr.removeAt(this.draggedLinkIndex); this.linksArr.insert(index, c); this.projectForm.markAsDirty(); } this.draggedLinkIndex = null; }

  // --- SOUMISSION CORRIGÉE ---
  onSubmit(): void {
    // 1. VÉRIFICATION PRIORITAIRE DES IMAGES
    // On vérifie les images AVANT de vérifier projectForm.invalid
    if (this.imagesArr.length === 0) {
      this.toastService.show("Ajoutez au moins une image de couverture.", "error");
      return; // On arrête tout ici
    }

    // 2. VÉRIFICATION DU RESTE DU FORMULAIRE
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      // On affine le message d'erreur si besoin
      if (this.tagsArr.length === 0) this.toastService.show("Ajoutez au moins un langage ou tag.", "error");
      else this.toastService.show("Veuillez remplir tous les champs obligatoires (*).", "error");
      return;
    }

    // 3. SAUVEGARDE
    const formVal = this.projectForm.value;
    const validLinks = formVal.links.filter((l: any) => l.title && l.url);
    const mainImg = formVal.images.length > 0 ? formVal.images[0] : '';
    const addImg = formVal.images.length > 1 ? formVal.images.slice(1) : [];

    const cleanAuthors = formVal.authors.map((u: User) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      avatarUrl: u.avatarUrl
    }));

    const projectToSave: Project = {
      id: this.projectId || 0,
      title: formVal.title,
      description: formVal.description,
      imageUrl: mainImg,
      additionalImages: addImg,
      tags: formVal.tags,
      modules: formVal.modules,
      authors: cleanAuthors,
      origin: formVal.origin,
      promo: formVal.promo,
      skillsLearned: formVal.skillsLearned,
      links: validLinks,
      isFavorite: false
    };

    try {
      const savedId = this.projectService.saveProject(projectToSave);
      this.projectForm.reset();
      this.toastService.show(this.isEditMode ? "Modifications enregistrées !" : "Projet créé avec succès !", "success");
      this.router.navigate(['/project', savedId]);
    } catch (e) {
      console.error(e);
      this.toastService.show("Erreur sauvegarde (Espace plein ?)", "error");
    }
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Project } from '../../core/models/project.model';
import { User } from '../../core/models/user.model';

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

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.existingTags = this.projectService.getAllTags();
    this.existingModules = this.projectService.getAllModules();

    const usersRaw = localStorage.getItem('portfilio_users');
    this.allUsers = usersRaw ? JSON.parse(usersRaw) : [];

    // Fallback si pas d'users en base locale
    if (this.allUsers.length === 0 && this.currentUser) {
      this.allUsers = [this.currentUser];
    }

    this.initForm();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.projectId = Number(id);
        this.loadProjectData(this.projectId);
      } else {
        // MODE CRÉATION : On ajoute l'utilisateur connecté par défaut
        if (this.currentUser) {
          this.addAuthor(this.currentUser);
        }
      }
    });
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

        project.tags.forEach(t => this.addTag(t));
        project.modules?.forEach(m => this.addModule(m));

        this.addImage(project.imageUrl);
        project.additionalImages?.forEach(img => this.addImage(img));

        (this.projectForm.get('authors') as FormArray).clear();
        project.authors.forEach(a => {
          const fullUser = this.allUsers.find(u => u.id === a.id);
          if (fullUser) this.addAuthor(fullUser);
          else this.authorsArr.push(this.fb.control(a)); // Fallback si user supprimé
        });

        if (project.links) {
          project.links.forEach(l => this.addLink(l.title, l.url));
        }
      }
    });
  }

  // --- GETTERS ---
  get imagesArr() { return this.projectForm.get('images') as FormArray; }
  get tagsArr() { return this.projectForm.get('tags') as FormArray; }
  get modulesArr() { return this.projectForm.get('modules') as FormArray; }
  get authorsArr() { return this.projectForm.get('authors') as FormArray; }
  get linksArr() { return this.projectForm.get('links') as FormArray; }

  // --- IMAGES ---
  triggerImageUpload(): void {
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.imagesArr.length < 5) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.addImage(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  addImage(url: string): void {
    if (this.imagesArr.length < 5) {
      this.imagesArr.push(this.fb.control(url));
    }
  }

  removeImage(index: number): void {
    this.imagesArr.removeAt(index);
  }

  onImgDragStart(index: number): void { this.draggedImageIndex = index; }
  onImgDragOver(event: DragEvent): void { event.preventDefault(); }
  onImgDrop(index: number): void {
    if (this.draggedImageIndex !== null && this.draggedImageIndex !== index) {
      const currentControl = this.imagesArr.at(this.draggedImageIndex);
      this.imagesArr.removeAt(this.draggedImageIndex);
      this.imagesArr.insert(index, currentControl);
    }
    this.draggedImageIndex = null;
  }

  // --- TAGS (SMART CASING) ---
  onTagInput(event: any): void {
    const val = event.target.value.toLowerCase();
    this.filteredTags = this.existingTags.filter(t => t.toLowerCase().includes(val));
  }

  addTag(val: string, input?: HTMLInputElement): void {
    const trimmedVal = val.trim();
    if (!trimmedVal) return;

    // RECHERCHE INTELLIGENTE : Est-ce que ce tag existe déjà (peu importe la casse) ?
    const existingMatch = this.existingTags.find(t => t.toLowerCase() === trimmedVal.toLowerCase());

    // Si oui, on prend la version existante (ex: "IHM"). Sinon, on prend la saisie utilisateur.
    const finalValue = existingMatch || trimmedVal;

    // Vérification doublon dans la liste actuelle du formulaire
    const alreadySelected = this.tagsArr.value.some((t: string) => t.toLowerCase() === finalValue.toLowerCase());

    if (!alreadySelected) {
      this.tagsArr.push(this.fb.control(finalValue));
    }

    if (input) input.value = '';
    this.filteredTags = [];
  }

  removeTag(index: number): void {
    this.tagsArr.removeAt(index);
  }

  // --- MODULES (SMART CASING) ---
  onModuleInput(event: any): void {
    const val = event.target.value.toLowerCase();
    this.filteredModules = this.existingModules.filter(m => m.toLowerCase().includes(val));
  }

  addModule(val: string, input?: HTMLInputElement): void {
    const trimmedVal = val.trim();
    if (!trimmedVal) return;

    // Même logique intelligente
    const existingMatch = this.existingModules.find(m => m.toLowerCase() === trimmedVal.toLowerCase());
    const finalValue = existingMatch || trimmedVal;

    const alreadySelected = this.modulesArr.value.some((m: string) => m.toLowerCase() === finalValue.toLowerCase());

    if (!alreadySelected) {
      this.modulesArr.push(this.fb.control(finalValue));
    }

    if (input) input.value = '';
    this.filteredModules = [];
  }

  removeModule(index: number): void {
    this.modulesArr.removeAt(index);
  }

  // --- AUTHORS ---
  onAuthorInput(event: any): void {
    const val = event.target.value.toLowerCase();
    this.filteredUsers = this.allUsers.filter(u =>
      !this.authorsArr.value.some((a: User) => a.id === u.id) &&
      (u.firstName.toLowerCase().includes(val) || u.lastName.toLowerCase().includes(val))
    );
  }

  addAuthor(user: User, input?: HTMLInputElement): void {
    // Vérification doublon au cas où
    if (!this.authorsArr.value.some((a: User) => a.id === user.id)) {
      this.authorsArr.push(this.fb.control(user));
    }
    if (input) input.value = '';
    this.filteredUsers = [];
  }

  removeAuthor(index: number): void {
    if (this.authorsArr.length > 1) {
      this.authorsArr.removeAt(index);
    } else {
      this.toastService.show("Le projet doit avoir au moins un auteur.", "error");
    }
  }

  // --- LINKS ---
  addLink(title: string = '', url: string = ''): void {
    const group = this.fb.group({
      title: [title, Validators.required],
      url: [url, [Validators.required]]
    });
    this.linksArr.push(group);
  }

  removeLink(index: number): void {
    this.linksArr.removeAt(index);
  }

  onLinkDragStart(index: number): void { this.draggedLinkIndex = index; }
  onLinkDragOver(event: DragEvent): void { event.preventDefault(); }
  onLinkDrop(index: number): void {
    if (this.draggedLinkIndex !== null && this.draggedLinkIndex !== index) {
      const currentGroup = this.linksArr.at(this.draggedLinkIndex);
      this.linksArr.removeAt(this.draggedLinkIndex);
      this.linksArr.insert(index, currentGroup);
    }
    this.draggedLinkIndex = null;
  }

  // --- NAVIGATION ---
  requestCancel(): void { this.showCancelModal = true; }
  confirmCancel(): void { this.router.navigate(['/profile']); }
  closeModal(): void { this.showCancelModal = false; }

  onSubmit(): void {
    // 1. Validation : Si invalide, on ne bloque pas le clic mais on prévient
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();

      // Petit check pour donner un feedback précis
      if (this.imagesArr.length === 0) {
        this.toastService.show("Ajoutez au moins une image de couverture.", "error");
      } else if (this.tagsArr.length === 0) {
        this.toastService.show("Ajoutez au moins un langage ou tag.", "error");
      } else {
        this.toastService.show("Veuillez remplir tous les champs obligatoires (*).", "error");
      }
      return;
    }

    const formVal = this.projectForm.value;

    // Normalisation finale
    const mainImg = formVal.images.length > 0 ? formVal.images[0] : '';
    const addImg = formVal.images.length > 1 ? formVal.images.slice(1) : [];

    const cleanAuthors = formVal.authors.map((u: User) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      avatarUrl: u.avatarUrl
    }));

    const newProject: Project = {
      id: this.projectId || 0,
      title: formVal.title,
      description: formVal.description,
      imageUrl: mainImg,
      additionalImages: addImg,
      tags: formVal.tags, // Déjà normalisés à l'ajout
      modules: formVal.modules, // Déjà normalisés à l'ajout
      authors: cleanAuthors,
      origin: formVal.origin,
      promo: formVal.promo,
      skillsLearned: formVal.skillsLearned,
      links: formVal.links,
      isFavorite: false
    };

    this.projectService.saveProject(newProject);
    this.toastService.show(this.isEditMode ? "Modifications enregistrées !" : "Projet créé avec succès !", "success");
    this.router.navigate(['/project', newProject.id]);
  }
}

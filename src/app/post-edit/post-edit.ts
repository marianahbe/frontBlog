import { Component, signal, input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { AccessPermission } from '../models/posts.interface';
import { CommonModule } from '@angular/common';
import { PostRequestBody } from '../models/posts.interface';
import { Header } from '../header/header';

const PERMISSION_LEVELS: { [key: string]: number } = {
  'Read & Edit': 2,
  'Read Only': 1,
  'None': 0
};

function permissionHierarchyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const teamAccess = control.get('team_access')?.value as AccessPermission;
    const authenticatedAccess = control.get('authenticated_access')?.value as AccessPermission;
    const publicAccess = control.get('public_access')?.value as 'Read Only' | 'None';

    if (!teamAccess || !authenticatedAccess || !publicAccess) {
        return null; // Permitir que Validators.required maneje los errores de campos vacíos
    }

    const teamLevel = PERMISSION_LEVELS[teamAccess];
    const authenticatedLevel = PERMISSION_LEVELS[authenticatedAccess];
    const publicLevel = PERMISSION_LEVELS[publicAccess];

    // team_access no puede ser menor que authenticated_access
    if (teamLevel < authenticatedLevel) {
      return { teamAccessHierarchy: true };
    }

    // authenticated_access no puede ser menor que public_access
    if (authenticatedLevel < publicLevel) {
      return { authenticatedAccessHierarchy: true };
    }

    return null;
  };
}
export class PostEdit {

}


@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, Header],
  templateUrl: './post-edit.html',
  styleUrl: './post-edit.scss',
})
export class PostCreate {

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  teamOptions = [
    { value: AccessPermission.READ_AND_EDIT, label: AccessPermission.READ_AND_EDIT },
    { value: AccessPermission.READ_ONLY, label: AccessPermission.READ_ONLY },
    { value: AccessPermission.NONE, label: AccessPermission.NONE },
  ];

  authenticatedOptions = [
    { value: AccessPermission.READ_AND_EDIT, label: AccessPermission.READ_AND_EDIT },
    { value: AccessPermission.READ_ONLY, label: AccessPermission.READ_ONLY },
    { value: AccessPermission.NONE, label: AccessPermission.NONE },
  ];

  publicOptions = [
    { value: AccessPermission.READ_ONLY, label: AccessPermission.READ_ONLY },
    { value: AccessPermission.NONE, label: AccessPermission.NONE },
  ];

  postForm!: FormGroup;
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.postForm = this.fb.group({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      content: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      // Valores por defecto
      team_access: new FormControl(AccessPermission.READ_ONLY, { nonNullable: true, validators: [Validators.required] }),
      authenticated_access: new FormControl(AccessPermission.READ_ONLY, { nonNullable: true, validators: [Validators.required] }),
      public_access: new FormControl('Read Only', { nonNullable: true, validators: [Validators.required] }),
    }, {
      // Validador de jerarquía a nivel de formulario
      validators: [permissionHierarchyValidator()]
    });
  }
  isFieldInvalid(field: string): boolean {
    const control = this.postForm.get(field);
    return !!control && control.hasError('required') && (control.dirty || control.touched);
  }

  isHierarchyError(): boolean {
    return this.postForm.hasError('teamAccessHierarchy') || this.postForm.hasError('authenticatedAccessHierarchy');
  }

  onCreatePost(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.postForm.invalid || this.isHierarchyError()) {
      this.postForm.markAllAsTouched();
      
      let message = 'Por favor, corrige los errores del formulario.';
      if (this.isHierarchyError()) {
        message = 'Error de validación: La jerarquía de permisos no se respeta.';
      } else if (this.postForm.hasError('required')) {
        message = 'Por favor, completa los campos de Título y Contenido.';
      }
      
      this.errorMessage.set(message);
      return;
    }

    this.isLoading.set(true);
    
    // Construir el cuerpo de la solicitud (Request Body)
    const formValue = this.postForm.getRawValue();

    const requestBody: PostRequestBody = {
      title: formValue.title,
      content: formValue.content,
      // Propiedad de acceso fija para el autor
      author_access: 'Read & Edit',
      team_access: formValue.team_access,
      authenticated_access: formValue.authenticated_access,
      public_access: formValue.public_access,
    };
  }

  onCancel(): void {
    this.postForm.reset({
      title: '',
      content: '',
      team_access: AccessPermission.READ_ONLY,
      authenticated_access: AccessPermission.READ_ONLY,
      public_access: 'Read Only'
    });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    console.log('Creación de post cancelada y formulario reseteado.');
  }
}

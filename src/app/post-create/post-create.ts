import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AccessPermission, PostRequestBody, PostsModel } from '../models/posts.interface';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { MatIconModule } from '@angular/material/icon';
import { PostFormBase } from '../post-form-base/post-form-base';

import { EditorModule } from '@tinymce/tinymce-angular';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Header, MatIconModule, EditorModule, MatSnackBarModule],
  templateUrl: './post-create.html',
  styleUrl: './post-create.scss',
})
export class PostCreate extends PostFormBase implements OnInit{

  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
      this.checkAuthAndProceed(() => {
        this.initForm(); // Inicializa el formulario SOLO si el usuario está autenticado
      });
  }

  onSubmit(): void {
      if (this.postForm.invalid) {
        this.postForm.markAllAsTouched();
        this.snackBar.open('Por favor, completa los campos obligatorios título y contenido', '', {
        duration: 4000,
      });
        return;
      }
    this.isLoading.set(true);
    
    // Construir el cuerpo de la solicitud
    const formValue = this.postForm.getRawValue();
    const excerptHTML = this.getStyledExcerpt(formValue.content, 200);

    const requestBody: PostRequestBody = {
      title: formValue.title,
      content: formValue.content,
      excerpt: excerptHTML,
      author_access: AccessPermission.READ_AND_WRITE,
      team_access: formValue.team_access,
      authenticated_access: formValue.authenticated_access,
      public_access: formValue.public_access,
    };
    
    this.postsService.createPost(requestBody).subscribe({
        next: (response: PostsModel) => {
            this.isLoading.set(false);
            this.snackBar.open('Post creado con éxito', '', {
              duration: 4000
            });
            
            if (response.id) {
                 this.router.navigate(['/posts', response.id]); 
            } else {
                 this.router.navigate(['/posts']); 
            }
        },
        error: (err) => {
            this.isLoading.set(false);
            const errorMsg = err.error?.detail || 'Error al intentar crear el post';
            
            this.snackBar.open(`Error de creación: ${errorMsg}`, '', {
              duration: 4000
            });
        }
    });
  }

  onCancel(): void {
    this.postForm.reset({
      title: '',
      content: '',
      team_access: AccessPermission.READ_ONLY,
      authenticated_access: AccessPermission.READ_ONLY,
      public_access: 'Read Only'
    });
    this.snackBar.open('Creación cancelada', '', { duration: 4000 });
    this.router.navigate(['/posts']);
  }

  goToPosts(): void {
    this.router.navigate(['/posts']);
  }
}

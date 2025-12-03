import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AccessPermission, PostRequestBody, PostsModel } from '../models/posts.interface';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PostFormBase } from '../post-form-base/post-form-base';

import { EditorModule } from '@tinymce/tinymce-angular';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, Header, MatIconModule, EditorModule, MatSnackBarModule],
  templateUrl: './post-edit.html',
  styleUrl: './post-edit.scss',
})
export class PostEdit extends PostFormBase implements OnInit {

  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    // Inicialización del formulario
    this.checkAuthAndProceed(() => {
        this.initForm(); 
         // Cargar datos del post y rellenar el formulario
        this.subscriptions.add(
            this.route.paramMap.pipe(
                switchMap(params => {
                    const id = params.get('id');
                    const postIdNum = id ? +id : null;
                    
                    this.postId.set(postIdNum);
                    this.isLoading.set(true);
                    
                    if (postIdNum) {
                        return this.postsService.getPost(postIdNum); 
                    }
                    
                    this.snackBar.open('ID de post no encontrado o inválido', '', { duration: 4000 });
                    this.isLoading.set(false);
                    return of(null as PostsModel | null); 
                })
            ).subscribe({
                next: (post: PostsModel | null) => {
                    if (post) {
                        // Rellenar el formulario con los datos del post
                        this.postForm.patchValue({
                            title: post.title,
                            content: post.content,
                            team_access: post.team_access,
                            authenticated_access: post.authenticated_access,
                            public_access: post.public_access, 
                        });
                    } else if (this.postId) {
                        this.snackBar.open(`No se pudo cargar el post con Id: ${this.postId()}`, '', { duration: 4000 });
                    }
                    this.isLoading.set(false);
                },
                error: (err) => {
                    this.snackBar.open(`Error al cargar el post: ${err.message || 'Error desconocido'}`, '', { duration: 4000 });
                    this.isLoading.set(false);
                }
            })
        );
    });
  };


  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    if (this.postForm.invalid) {
        this.postForm.markAllAsTouched();
        this.snackBar.open('Por favor, completa los campos obligatorios Título y Contenido', '', {
            duration: 4000,
        });
        return;
    }
    
    const postIdValue = this.postId();
    if (!postIdValue) {
        this.snackBar.open('No se puede actualizar el post, Id no encontrado', '', { duration: 4000 });
        return;
    }

    this.isLoading.set(true);
    
    const formValue = this.postForm.getRawValue();
    const excerptHTML = this.getStyledExcerpt(formValue.content, 200)

    const requestBody: PostRequestBody = {
        title: formValue.title,
        content: formValue.content,
        excerpt: excerptHTML,
        author_access: AccessPermission.READ_AND_WRITE, 
        team_access: formValue.team_access,
        authenticated_access: formValue.authenticated_access,
        public_access: formValue.public_access,
    };
    this.postsService.updatePost(postIdValue, requestBody).subscribe({
        next: (response: PostsModel) => {
            this.isLoading.set(false);
            this.snackBar.open('¡Post actualizado con éxito!', '', { duration: 4000 });
            this.router.navigate(['/posts', postIdValue]); 
        },
        error: (err) => {
            this.isLoading.set(false);
            const errorMsg = err.error?.detail || 'Error desconocido al intentar actualizar el post.';
            this.snackBar.open(`Error de actualización: ${errorMsg}`, 'Cerrar', { duration: 4000 });
        }
    });
  }

  onCancel(): void {
    this.router.navigate(['/posts']);
  }

  goToPosts(): void {
    this.router.navigate(['/posts']);
  }
}

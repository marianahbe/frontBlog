import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { AccessPermission, PostRequestBody } from '../models/posts.interface';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PostsService } from '../services/posts.service'; 
import { MatIconModule } from '@angular/material/icon'; 
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../services/auth';

import { EditorModule } from '@tinymce/tinymce-angular';

export const PERMISSION_LEVELS: { [key: string]: number } = {
  'Read & Write': 2,
  'Read Only': 1,
  'None': 0
};
@Component({
  selector: 'app-post-form-base',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatIconModule, EditorModule],
  template: ``,
})
export abstract class PostFormBase implements OnDestroy {

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  teamOptions = [
    { value: AccessPermission.READ_AND_WRITE, label: AccessPermission.READ_AND_WRITE },
    { value: AccessPermission.READ_ONLY, label: AccessPermission.READ_ONLY },
    { value: AccessPermission.NONE, label: AccessPermission.NONE },
  ];

  authenticatedOptions = [
    { value: AccessPermission.READ_AND_WRITE, label: AccessPermission.READ_AND_WRITE },
    { value: AccessPermission.READ_ONLY, label: AccessPermission.READ_ONLY },
    { value: AccessPermission.NONE, label: AccessPermission.NONE },
  ];

  publicOptions = [
    { value: AccessPermission.READ_ONLY, label: AccessPermission.READ_ONLY },
    { value: AccessPermission.NONE, label: AccessPermission.NONE },
  ];

  postForm!: FormGroup;
  // para que create y edit puedan hacer uso 
  protected postId = signal<number | null>(null);
  protected fb = inject(FormBuilder); 
  protected subscriptions = new Subscription();
  protected postsService = inject(PostsService);
  protected router = inject(Router);
  protected authService = inject(AuthService);

  protected checkAuthAndProceed(callback: () => void): void {
    this.authService.isLoggedIn.pipe(
      take(1)
    ).subscribe(isLoggedIn => {
      if (!isLoggedIn) {
        this.router.navigate(['/posts']);
      } else {
        callback();
      }
    });
  }

  protected initForm(initialData?: any): void {
    // definición de formulario compartida
    this.postForm = this.fb.group({
      title: new FormControl(initialData?.title || '', { nonNullable: true, validators: [Validators.required] }),
      content: new FormControl(initialData?.content || '', { nonNullable: true, validators: [Validators.required] }),
      team_access: new FormControl(initialData?.team_access || AccessPermission.READ_ONLY, { nonNullable: true, validators: [Validators.required] }),
      authenticated_access: new FormControl(initialData?.authenticated_access || AccessPermission.READ_ONLY, { nonNullable: true, validators: [Validators.required] }),
      public_access: new FormControl(initialData?.public_access || 'Read Only', { nonNullable: true, validators: [Validators.required] }),
    });
    this.setupPermissionChangeListeners();
  }

  // jerarquía de permisos
  protected setupPermissionChangeListeners(): void {
    const teamControl = this.postForm.get('team_access') as FormControl;
    const authControl = this.postForm.get('authenticated_access') as FormControl;
    const publicControl = this.postForm.get('public_access') as FormControl;
    
    // team access ajusta hacia abajo
    this.subscriptions.add(teamControl.valueChanges.subscribe(newTeamAccess => {
      const newTeamLevel = PERMISSION_LEVELS[newTeamAccess];
      let authLevel = PERMISSION_LEVELS[authControl.value];
      let publicLevel = PERMISSION_LEVELS[publicControl.value];

      if (newTeamLevel < authLevel) {
        authControl.setValue(newTeamAccess, { emitEvent: false }); 
        authLevel = newTeamLevel;
      }
      
      if (authLevel < publicLevel) {
        publicControl.setValue(authControl.value, { emitEvent: false }); 
      }
    }));
    
    // public access ajusta hacia arriba
    this.subscriptions.add(publicControl.valueChanges.subscribe(newPublicAccess => {
      const newPublicLevel = PERMISSION_LEVELS[newPublicAccess];
      let authLevel = PERMISSION_LEVELS[authControl.value];
      let teamLevel = PERMISSION_LEVELS[teamControl.value];

      if (authLevel < newPublicLevel) {
        authControl.setValue(newPublicAccess, { emitEvent: false }); 
        authLevel = newPublicLevel;
      }
      
      if (teamLevel < authLevel) {
        teamControl.setValue(authControl.value, { emitEvent: false }); 
      }
    }));
    
    // authenticated access ajusta hacia arriba y abajito
    this.subscriptions.add(authControl.valueChanges.subscribe(newAuthAccess => {
      const newAuthLevel = PERMISSION_LEVELS[newAuthAccess];
      let teamLevel = PERMISSION_LEVELS[teamControl.value];
      let publicLevel = PERMISSION_LEVELS[publicControl.value];

      if (teamLevel < newAuthLevel) {
        teamControl.setValue(newAuthAccess, { emitEvent: false }); 
        teamLevel = newAuthLevel;
      }

      if (newAuthLevel < publicLevel) {
        publicControl.setValue(newAuthAccess, { emitEvent: false }); 
      }
    }));
  }

  // validación de campo
  isFieldInvalid(field: string): boolean {
    const control = this.postForm.get(field);
    return !!control && control.hasError('required') && (control.dirty || control.touched);
  }

  // el manejo de envío de formulario es diferente para crear y editar post
  abstract onSubmit(): void; 
  
  // limpieza de suscripciones
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected getStyledExcerpt(htmlContent: string, length: number = 200): string {
    if (!htmlContent) return '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    let charCount = 0;
    const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null as any
    );

    let currentNode: Node | null;
    let stopNode: Node | null = null;
    let remainingText = '';

    // recorre los nodos de texto para encontrar el punto de corte
    while (currentNode = walker.nextNode()) {
        const text = currentNode.textContent || '';
        
        if (charCount + text.length >= length) {
            // nodo donde cortar
            const remaining = length - charCount;
            remainingText = text.substring(0, remaining);
            stopNode = currentNode;
            charCount = length;
            break;
        } else {
            charCount += text.length;
        }
    }

    if (!stopNode) {
        return htmlContent;
    }

    stopNode.textContent = remainingText + '...';

    let nodeToDelete: Node | null = stopNode.nextSibling;
    while (nodeToDelete) {
        const next = nodeToDelete.nextSibling;
        if (nodeToDelete.parentNode) {
            nodeToDelete.parentNode.removeChild(nodeToDelete);
        }
        nodeToDelete = next;
    }

    let parent = stopNode.parentNode;
    while (parent && parent !== tempDiv) {
        let nextSibling = parent.nextSibling;
        while (nextSibling) {
            const next = nextSibling.nextSibling;
            if (nextSibling.parentNode) {
              nextSibling.parentNode.removeChild(nextSibling);
            }
            nextSibling = next;
        }
        parent = parent.parentNode;
    }

    //  devolver el HTML truncado
    let finalHtml = tempDiv.innerHTML;
    finalHtml = finalHtml.replace(/<\/[pdhHl][^>]*>\s*$/, ''); // elimina </p>, </div>, </h1> y así 
    finalHtml = finalHtml.trim();
    finalHtml = finalHtml.replace(/(\.\.\.)\s*(&nbsp;)?\s*$/i, '$1'); 
    
    finalHtml += ' '; 

    return finalHtml;
   }
}
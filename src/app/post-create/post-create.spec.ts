import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PostCreate } from './post-create';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AccessPermission, PostsModel } from '../models/posts.interface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

import { AuthService } from '../services/auth';

// importar para remover
import { Header } from '../header/header';
import { EditorModule } from '@tinymce/tinymce-angular';

// mocks de componentes
@Component({ selector: 'app-header', template: '', standalone: true })
class MockHeader {}

// mock TinyMCE
@Component({
  selector: 'editor',
  template: '',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockEditor),
      multi: true
    }
  ]
})
class MockEditor implements ControlValueAccessor {
  @Input() init: any;
  @Input() apiKey: any;
  
  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {}
}

// mock data
const mockCreatedPost: PostsModel = {
  id: 101,
  title: 'Nuevo Post',
  content: '<p>Contenido</p>',
  excerpt: 'Contenido...',
  author: 'testuser',
  author_team: 'TeamA', 
  timestamp: '2025-01-01',
  author_access: 'Read & Write', 
  team_access: AccessPermission.READ_ONLY,
  authenticated_access: AccessPermission.READ_ONLY,
  public_access: 'Read Only' 
};

describe('PostCreate Component', () => {
  let component: PostCreate;
  let fixture: ComponentFixture<PostCreate>;

  let postsService: jasmine.SpyObj<PostsService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const postsServiceSpy = jasmine.createSpyObj('PostsService', ['createPost']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
       isLoggedIn: of(true), // simulando el usuario logueado
    });

    // configuración por defecto
    postsServiceSpy.createPost.and.returnValue(of(mockCreatedPost));

    await TestBed.configureTestingModule({
      imports: [
        PostCreate, 
        ReactiveFormsModule,
        NoopAnimationsModule 
      ],
      providers: [
        { provide: PostsService, useValue: postsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }, 
        { provide: AuthService, useValue: authServiceSpy },
      ]
    })
    .overrideComponent(PostCreate, {
      remove: { imports: [Header, EditorModule, MatSnackBarModule] },
      add: { imports: [MockHeader, MockEditor] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostCreate);
    component = fixture.componentInstance;
    
    // inyecciones
    postsService = TestBed.inject(PostsService) as jasmine.SpyObj<PostsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture.detectChanges(); // ejecuta ngOnInit -> initForm
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.postForm).toBeDefined();
  });

  describe('onSubmit', () => {
    
    it('should validate form invalidity and show SnackBar error', () => {
      // formulario vacío (invalido)
      component.postForm.patchValue({ title: '', content: '' });
      
      component.onSubmit();

      expect(component.postForm.invalid).toBeTrue();
      // verificar SnackBar en lugar de signal
      expect(snackBar.open).toHaveBeenCalledWith(
        'Por favor, completa los campos obligatorios título y contenido', 
        '', 
        jasmine.objectContaining({ duration: 4000 })
      );
      expect(postsService.createPost).not.toHaveBeenCalled();
    });

    it('should submit valid form, show SnackBar success and navigate', () => {
      // llenar el formulario
      component.postForm.patchValue({
        title: 'Título',
        content: '<p>Contenido</p>',
        team_access: AccessPermission.READ_ONLY,
        authenticated_access: AccessPermission.READ_ONLY,
        public_access: 'Read Only'
      });

      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      
      // verificar SnackBar exitoso
      expect(snackBar.open).toHaveBeenCalledWith(
        'Post creado con éxito', 
        '', 
        jasmine.objectContaining({ duration: 4000 })
      );
      
      expect(postsService.createPost).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Título',
        content: '<p>Contenido</p>',
        author_access: AccessPermission.READ_AND_WRITE 
      }));

      expect(router.navigate).toHaveBeenCalledWith(['/posts', 101]);
    });

    it('should navigate to /posts if response has no ID', () => {
      postsService.createPost.and.returnValue(of({ ...mockCreatedPost, id: undefined } as any));

      component.postForm.patchValue({ title: 'A', content: 'B' });
      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });

    it('should handle API error correctly and show SnackBar', () => {
      const errorResponse = { error: { detail: 'Título duplicado' } };
      postsService.createPost.and.returnValue(throwError(() => errorResponse));
      
      component.postForm.patchValue({ title: 'A', content: 'B' });
      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      
      // verificar SnackBar de error
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error de creación: Título duplicado',
        '',
        jasmine.objectContaining({ duration: 4000 })
      );
    });

    it('should use default error message if API error lacks detail', () => {
      postsService.createPost.and.returnValue(throwError(() => new Error('Server dead')));
      
      component.postForm.patchValue({ title: 'A', content: 'B' });
      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error de creación: Error al intentar crear el post',
        '',
        jasmine.any(Object)
      );
    });
  });

  describe('Navigation & Cancel', () => {
    it('onCancel should reset form, show message and navigate', () => {
      spyOn(component.postForm, 'reset');
      
      component.onCancel();

      expect(component.postForm.reset).toHaveBeenCalled();
      
      // verificar SnackBar cancelado
      expect(snackBar.open).toHaveBeenCalledWith(
        'Creación cancelada', 
        '', 
        jasmine.objectContaining({ duration: 4000 })
      );
      
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });

    it('goToPosts should navigate to /posts', () => {
      component.goToPosts();
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });
  });

  describe('Inherited Logic (getStyledExcerpt)', () => {
    it('should generate excerpt for the request body', () => {
      const longContent = '<p>' + 'a'.repeat(300) + '</p>'; 
      component.postForm.patchValue({ title: 'Test', content: longContent });

      component.onSubmit();

      const args = postsService.createPost.calls.mostRecent().args[0];
      
      expect(args.excerpt).toBeDefined();
      expect(args.excerpt).not.toEqual(longContent);
    });
  });

});
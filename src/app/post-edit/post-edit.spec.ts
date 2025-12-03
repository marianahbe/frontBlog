import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PostEdit } from './post-edit'; // Asegúrate de que la ruta sea correcta
import { PostsService } from '../services/posts.service';
import { Router, ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { of, throwError, BehaviorSubject } from 'rxjs';
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
const mockExistingPost: PostsModel = {
  id: 999,
  title: 'Título Original',
  content: '<p>Contenido Original</p>',
  excerpt: 'Contenido...',
  author: 'Yo',
  author_team: 'Team A',
  timestamp: '2025-01-01',
  author_access: 'Read & Write',
  team_access: AccessPermission.READ_ONLY,
  authenticated_access: AccessPermission.READ_ONLY,
  public_access: 'Read Only'
};

describe('PostEdit Component', () => {
  let component: PostEdit;
  let fixture: ComponentFixture<PostEdit>;

  let postsService: jasmine.SpyObj<PostsService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  
  // subject para controlar la ruta dinámicamente
  let routeParamMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    // asegurar que cada test empiece con un id válido
    routeParamMapSubject = new BehaviorSubject(convertToParamMap({ id: '999' }));

    const postsServiceSpy = jasmine.createSpyObj('PostsService', ['getPost', 'updatePost']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    // mock de authService
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
       isLoggedIn: of(true) // simular el usuario logueado
    });

    // devuelve el post existente
    postsServiceSpy.getPost.and.returnValue(of(mockExistingPost));
    postsServiceSpy.updatePost.and.returnValue(of({ ...mockExistingPost, title: 'Editado' }));

    routeParamMapSubject.next(convertToParamMap({ id: '999' }));

    await TestBed.configureTestingModule({
      imports: [
        PostEdit, 
        ReactiveFormsModule,
        NoopAnimationsModule 
      ],
      providers: [
        { provide: PostsService, useValue: postsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { 
          provide: ActivatedRoute, 
          useValue: { paramMap: routeParamMapSubject.asObservable() } 
        }
      ]
    })
    .overrideComponent(PostEdit, {
      // eliminar dependencias reales
      remove: { imports: [Header, EditorModule, MatSnackBarModule] },
      // añadir los mocks
      add: { imports: [MockHeader, MockEditor] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostEdit);
    component = fixture.componentInstance;
    
    // inyecciones
    postsService = TestBed.inject(PostsService) as jasmine.SpyObj<PostsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  describe('Initialization (ngOnInit)', () => {
    it('should create and init form', () => {
      fixture.detectChanges(); 
      expect(component).toBeTruthy();
      expect(component.postForm).toBeDefined();
    });

    it('should load post data and patch the form if ID exists', () => {
      fixture.detectChanges(); // dispara ngOnInit -> switchMap -> getPost

      expect(component.isLoading()).toBeFalse();
      expect(postsService.getPost).toHaveBeenCalledWith(999);
      
      // verificar que el formulario se llenó con los datos del mock
      expect(component.postForm.value).toEqual(jasmine.objectContaining({
        title: 'Título Original',
        content: '<p>Contenido Original</p>',
        public_access: 'Read Only'
      }));
    });

    it('should handle invalid ID in route (null)', () => {
      // simular ruta sin id
      routeParamMapSubject.next(convertToParamMap({}));

      fixture.detectChanges();

      expect(postsService.getPost).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'ID de post no encontrado o inválido', 
        '', 
        jasmine.objectContaining({ duration: 4000 })
      );
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle API error when fetching post', () => {
      postsService.getPost.and.returnValue(throwError(() => new Error('Not found')));
      
      fixture.detectChanges();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringMatching(/Error al cargar el post/), 
        '', 
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBeFalse();
    });
  });


  describe('onSubmit (Update)', () => {
    beforeEach(() => {
        fixture.detectChanges(); // carga inicial exitosa
    });

    it('should validate form invalidity', () => {
      // invalidar formulario
      component.postForm.patchValue({ title: '' });
      
      component.onSubmit();

      expect(component.postForm.invalid).toBeTrue();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Por favor, completa los campos obligatorios Título y Contenido',
        '',
        jasmine.any(Object)
      );
      expect(postsService.updatePost).not.toHaveBeenCalled();
    });

    it('should error if postId signal is missing', () => {
      (component as any).postId.set(null); 
      
      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'No se puede actualizar el post, Id no encontrado',
        '',
        jasmine.any(Object)
      );
      expect(postsService.updatePost).not.toHaveBeenCalled();
    });

    it('should update post successfully and navigate', () => {
      // cambiar valores en el formulario
      component.postForm.patchValue({ title: 'Título Editado' });

      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      
      expect(postsService.updatePost).toHaveBeenCalledWith(
        999, 
        jasmine.objectContaining({
            title: 'Título Editado',
            author_access: 'Read & Write'
        })
      );

      expect(snackBar.open).toHaveBeenCalledWith(
        '¡Post actualizado con éxito!', '', jasmine.any(Object)
      );
      expect(router.navigate).toHaveBeenCalledWith(['/posts', 999]);
    });

    it('should handle API error on update', () => {
      postsService.updatePost.and.returnValue(throwError(() => ({ error: { detail: 'Forbidden' } })));

      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error de actualización: Forbidden', 'Cerrar', jasmine.any(Object)
      );
    });
  });


  describe('Navigation', () => {
    it('onCancel should navigate to /posts', () => {
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });

    it('goToPosts should navigate to /posts', () => {
      component.goToPosts();
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostFormBase, PERMISSION_LEVELS } from './post-form-base'; 
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { BehaviorSubject } from 'rxjs';
import { AccessPermission } from '../models/posts.interface';

// mock de auth service
class MockAuthService {
  isLoggedIn = new BehaviorSubject<boolean>(true); // Por defecto logueado
}

// componente para testing
@Component({
  template: '',
  standalone: true,
  imports: [ReactiveFormsModule],
})
class TestPostFormComponent extends PostFormBase {
  onSubmit(): void {}

public testInitForm(data?: any): void {
    this.initForm(data);
}

  public testCheckAuth(callback: () => void): void {
    this.checkAuthAndProceed(callback);
  }

  public testGetStyledExcerpt(html: string, len?: number): string {
    return this.getStyledExcerpt(html, len);
  }
}

describe('PostFormBase (Abstract Logic)', () => {
  let component: TestPostFormComponent;
  let fixture: ComponentFixture<TestPostFormComponent>;
  let authService: MockAuthService;
  let router: jasmine.SpyObj<Router>;
  let postsService: jasmine.SpyObj<PostsService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const postsServiceSpy = jasmine.createSpyObj('PostsService', ['createPost', 'updatePost']);

    await TestBed.configureTestingModule({
      imports: [TestPostFormComponent, ReactiveFormsModule], 
      providers: [
        { provide: PostsService, useValue: postsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useClass: MockAuthService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestPostFormComponent);
    component = fixture.componentInstance;
    
    // inyectar las referencias para usarlas en los expect
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    postsService = TestBed.inject(PostsService) as jasmine.SpyObj<PostsService>;
    
    // inicialización por defecto
    component.testInitForm();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  describe('Form Initialization', () => {
    it('should initialize form with default empty values', () => {
      const val = component.postForm.value;
      expect(val.title).toBe('');
      expect(val.team_access).toBe(AccessPermission.READ_ONLY);
    });

    it('should initialize form with provided data', () => {
      const data = {
        title: 'Test Title',
        content: 'Content',
        team_access: AccessPermission.READ_AND_WRITE,
        authenticated_access: AccessPermission.READ_ONLY,
        public_access: AccessPermission.NONE
      };
      component.testInitForm(data); 
      
      const val = component.postForm.value;
      expect(val.title).toBe('Test Title');
      expect(val.team_access).toBe(AccessPermission.READ_AND_WRITE);
    });

    it('isFieldInvalid should return true for touched required invalid fields', () => {
        const titleControl = component.postForm.get('title');
        titleControl?.setValue(''); 
        titleControl?.markAsTouched(); 

        expect(component.isFieldInvalid('title')).toBeTrue();
    });
  });


  describe('Permission Logic (Cascading)', () => {
    it('should downgrade Auth and Public access when Team access is lowered', () => {
        component.postForm.patchValue({
            team_access: AccessPermission.READ_AND_WRITE,
            authenticated_access: AccessPermission.READ_AND_WRITE,
            public_access: AccessPermission.READ_AND_WRITE
        });

        component.postForm.get('team_access')?.setValue(AccessPermission.NONE);

        expect(component.postForm.get('authenticated_access')?.value).toBe(AccessPermission.NONE);
        expect(component.postForm.get('public_access')?.value).toBe(AccessPermission.NONE);
    });

    it('should upgrade Team access when Public access is raised', () => {
        component.postForm.patchValue({
            team_access: AccessPermission.NONE,
            authenticated_access: AccessPermission.NONE,
            public_access: AccessPermission.NONE
        });

        component.postForm.get('public_access')?.setValue(AccessPermission.READ_ONLY);

        expect(component.postForm.get('authenticated_access')?.value).toBe(AccessPermission.READ_ONLY);
        expect(component.postForm.get('team_access')?.value).toBe(AccessPermission.READ_ONLY);
    });

    it('should adjust surrounding permissions when Authenticated access changes', () => {
        component.postForm.patchValue({
            team_access: AccessPermission.READ_AND_WRITE,
            authenticated_access: AccessPermission.READ_ONLY,
            public_access: AccessPermission.READ_ONLY
        });

        // si bajar auth -> baja public
        component.postForm.get('authenticated_access')?.setValue(AccessPermission.NONE);
        expect(component.postForm.get('public_access')?.value).toBe(AccessPermission.NONE);
        expect(component.postForm.get('team_access')?.value).toBe(AccessPermission.READ_AND_WRITE);

        // si sube auth -> sube team 
        component.postForm.patchValue({ team_access: AccessPermission.READ_ONLY });
        component.postForm.get('authenticated_access')?.setValue(AccessPermission.READ_AND_WRITE);
        expect(component.postForm.get('team_access')?.value).toBe(AccessPermission.READ_AND_WRITE);
    });
  });


  describe('Auth Logic', () => {
    it('checkAuthAndProceed should execute callback if logged in', () => {
        authService.isLoggedIn.next(true); 
        const spyCallback = jasmine.createSpy('callback');

        component.testCheckAuth(spyCallback);

        expect(spyCallback).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('checkAuthAndProceed should navigate to /posts if NOT logged in', () => {
        authService.isLoggedIn.next(false);
        const spyCallback = jasmine.createSpy('callback');

        component.testCheckAuth(spyCallback);

        expect(spyCallback).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });
  });


  describe('Excerpt Generation (getStyledExcerpt)', () => {
    it('should return plain HTML if length is short', () => {
        const html = '<p>Short text</p>';
        const result = component.testGetStyledExcerpt(html, 100);
        expect(result.trim()).toBe(html);
    });

    it('should truncate text correctly ignoring tags length', () => {
        const html = '<p>Hello <b>World</b></p>';
        const result = component.testGetStyledExcerpt(html, 5);
        expect(result).toContain('Hello...');
    });

    it('should handle nested structures and clean up empty tags', () => {
        const html = '<div><p>Start</p><p>End</p></div>';
        const result = component.testGetStyledExcerpt(html, 3);
        expect(result).toContain('Sta...');
    });

    it('should return empty string if input is null/undefined', () => {
        expect(component.testGetStyledExcerpt('')).toBe('');
    });
  });
});
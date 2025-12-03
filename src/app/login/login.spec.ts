import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { UserLogin } from '../models/user-login.interface';
import { of, throwError } from 'rxjs';

import { Router, ActivatedRoute, UrlTree, NavigationEnd } from '@angular/router';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['loginUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    authServiceSpy.isLoggedIn = of(false);
    
    // configurar propiedades y retornos por defecto de los mocks
    routerSpy.events = of(new NavigationEnd(0, 'http://localhost:4200/posts', 'http://localhost:4200/posts'));
    routerSpy.createUrlTree.and.returnValue({} as UrlTree);
    routerSpy.serializeUrl.and.returnValue('mock-url');

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        FormBuilder,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: { snapshot: {}, parent: {} } },
      ],
    })
    .overrideProvider(MatSnackBar, { useValue: snackBarSpy })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    // inyectar los servicios para usarlos en los expect
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Pruebas del formulario
  it('Form should be valid with correct data', () => {
    component.loginForm.setValue({
        email: 'test@email.com',
        password: '123456',
    });
    component.loginForm.updateValueAndValidity();
    expect(component.loginForm.valid).toBe(true);
  });

  it('Form should be invalid if email is missing', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    emailControl?.updateValueAndValidity();
    expect(emailControl?.hasError('required')).toBe(true);
  });

  it('Form should be invalid if email format is incorrect', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.updateValueAndValidity();
    expect(emailControl?.hasError('email')).toBe(true);
  });

  it('Form should be invalid if password is missing', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    passwordControl?.updateValueAndValidity();
    expect(passwordControl?.hasError('required')).toBe(true);
  });

  it('togglePasswordVisibility should change passwordVisible state', () => {
    component.passwordVisible = false;
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(true);
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(false);
  });

  describe('onSubmit', () => {
    const validCredentials = {
      email: 'testuser@email.com',
      password: '123456',
    };

    it ('Should call authService.loginUser, navigate to /posts and show success snackbar', () => {
      component.loginForm.setValue(validCredentials);
      const mockAuthResponse = {
        token: 'mock-token',
        user_data: { id: 1, role: 'ADMIN', team_id: 1, username: 'testuser' }
      };
      authService.loginUser.and.returnValue(of(mockAuthResponse as any));
      component.onSubmit();

      expect(authService.loginUser).toHaveBeenCalledWith(validCredentials);
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
      expect(snackBar.open).toHaveBeenCalledWith('Login exitoso', '', { duration: 4000 });

    });

    it('should handle service error and show error notification', () => {
      component.loginForm.setValue(validCredentials);

      const mockBackendError = { non_field_errors: ['Invalid credentials.'] };
      const mockErrorResponse = new HttpErrorResponse({
        error: mockBackendError, status: 400, statusText: 'Bad Request',
      });
      // error que usa para el snackbar
      authService.loginUser.and.returnValue(throwError(() => mockErrorResponse));
      component.onSubmit();
      const expectedMessage = 'Credenciales inválidas, por favor verifica tu email y contraseña';
      // llamada al servicio
      expect(authService.loginUser).toHaveBeenCalled();
      // no navega
      expect(router.navigate).not.toHaveBeenCalled();

      // muestra el snackbar de error
      expect(snackBar.open).toHaveBeenCalledWith(expectedMessage, '', { duration: 4000 });
    });

    it('should not call authService.loginUser if the form is invalid', () => {
      component.loginForm.get('email')?.setValue('');
      component.loginForm.get('password')?.setValue(validCredentials.password);

      component.onSubmit();

      // el servicio no se ha llamado
      expect(authService.loginUser).not.toHaveBeenCalled();
      expect(snackBar.open).not.toHaveBeenCalled();
    });

  });
});
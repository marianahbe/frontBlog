import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { Router, ActivatedRoute, UrlTree, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { passwordMatchValidator } from '../validator/password.validator'; 
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    // Configurar propiedades y retornos por defecto de los mocks
    routerSpy.events = of(new NavigationEnd(0, 'http://localhost:4200/login', 'http://localhost:4200/login'));
    routerSpy.createUrlTree.and.returnValue({} as UrlTree);
    routerSpy.serializeUrl.and.returnValue('mock-url');

    await TestBed.configureTestingModule({
      imports: [Register, ReactiveFormsModule],
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
    
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;

    // Inyectar los servicios para usarlos en los expect
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
    component.registerForm.setValue({
        username: 'testuser',
        email: 'test@email.com',
        password: '123456',
        passwordConf: '123456',
    });
    component.registerForm.updateValueAndValidity();
    expect(component.registerForm.valid).toBe(true);
  });

  it("Form should be invalid if the passwords don't match", () => {
    component.registerForm.setValue({
        username: 'testuser',
        email: 'test@email.com',
        password: '123456',
        passwordConf: '123789', // Contraseña mala
    });

    // Forzar la validadción 
    component.registerForm.updateValueAndValidity();
    
    expect(component.registerForm.valid).toBe(false);
    expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
  });

 it('Form should be invalid if username is missing', () => {
    const control = component.registerForm.get('username');
    control?.setValue('');
    expect(control?.hasError('required')).toBe(true);
  });

  it('Form should be invalid if email is missing', () => {
    const control = component.registerForm.get('email');
    control?.setValue('');
    expect(control?.hasError('required')).toBe(true);
  });

  it('Form should be invalid if email format is incorrect', () => {
    const control = component.registerForm.get('email');
    control?.setValue('test-invalid-email'); 
    expect(control?.hasError('pattern')).toBe(true); 
  });

  it('Form should be invalid if password is missing', () => {
    const control = component.registerForm.get('password');
    control?.setValue('');
    expect(control?.hasError('required')).toBe(true);
  });

  it('Form should be invalid if passwordConf is missing', () => {
    const control = component.registerForm.get('passwordConf');
    control?.setValue('');
    expect(control?.hasError('required')).toBe(true);
  });

  // Prueba función OnSubmit
  describe('onSubmit', () => {
    
    it ('should call authService.registerUser, navigate and show success snackbar', () => {
      const validData = {
        username: 'testuser',
        email: 'test@email.com',
        password: '123456',
        passwordConf: '123456',
      };
      component.registerForm.setValue(validData);

      authService.registerUser.and.returnValue(of({ message: 'Registro OK' }));

      component.onSubmit();

      expect(authService.registerUser).toHaveBeenCalledWith(jasmine.objectContaining({ 
        username: validData.username,
        email: validData.email,
        password: validData.password,
      }));

      expect(router.navigate).toHaveBeenCalledWith(['/login']); 
      expect(snackBar.open).toHaveBeenCalledWith('Registro exitoso', '', { duration: 4000 });
    });

    it('Should handle service error and show error notification', () => {
      const validData = {
        username: 'testuser',
        email: 'test@email.com',
        password: '123456',
        passwordConf: '123456',
      };
      component.registerForm.setValue(validData);
      
      const mockErrorResponse = new HttpErrorResponse({
        error: { message: 'El usuario ya existe' },
        status: 409,
        statusText: 'Conflict',
      });

      // Simula que el servicio devuelve un error
      authService.registerUser.and.returnValue(throwError(() => mockErrorResponse));

      component.onSubmit();

      expect(authService.registerUser).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled(); 

      // El componente extrae error.error, que es { message: 'El usuario ya existe' }
      const expectedErrorMessage = JSON.stringify(mockErrorResponse.error);
      expect(snackBar.open).toHaveBeenCalledWith(expectedErrorMessage, '', { duration: 4000 });
    });

    it("Shouldn't call authService.registerUser if the form is invalid", () => {
      // Dejar el formulario inválido
      component.registerForm.get('username')?.setValue(''); 
      component.onSubmit();
      
      expect(authService.registerUser).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Por favor revisa el formulario y las contraseñas.', '', { duration: 4000 });
    });

  });

  it('togglePasswordVisibility should change passwordVisible state', () => {
    component.passwordVisible = false;
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(true);
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(false);
  });

  it('togglePasswordConfVisibility should change passwordConfVisible state', () => {
    component.passwordConfVisible = false;
    component.togglePasswordConfVisibility();
    expect(component.passwordConfVisible).toBe(true);
    component.togglePasswordConfVisibility();
    expect(component.passwordConfVisible).toBe(false);
  });

});

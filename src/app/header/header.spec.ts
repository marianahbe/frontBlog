import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from '../register/register';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { Router, ActivatedRoute, UrlTree, NavigationEnd } from '@angular/router';

import { Header } from './header';

// spy para auth service
const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
  isLoggedIn: of(true),
  user$: of({ username: 'testuser', email: 'test@email.com' }),
});

const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);

const mockActivatedRoute = {
  snapshot: {},
  parent: {},
};

// Configurar propiedades y retornos por defecto de los mocks
routerSpy.events = of(new NavigationEnd(0, 'http://localhost:4200/posts', 'http://localhost:4200/posts'));
routerSpy.createUrlTree.and.returnValue({} as UrlTree);
routerSpy.serializeUrl.and.returnValue('mock-url');

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let windowConfirmSpy: jasmine.Spy;

  beforeEach(async () => {
    windowConfirmSpy = spyOn(window, 'confirm');
    await TestBed.configureTestingModule({
      imports: [Header, CommonModule ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    })
    .compileComponents();

    authService = TestBed.inject(AuthService) as any; 
    snackBar = TestBed.inject(MatSnackBar) as any;

    authService.logout.calls.reset();
    snackBar.open.calls.reset();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should initialize isLoggedIn$ and currentUser$ from authService', (done) => {
    component.isLoggedIn$.subscribe(value => {
      expect(value).toBe(true, 'isLoggedIn$ debe ser true');
    });
    component.currentUser$.subscribe(user => {
      expect(user).toEqual({ username: 'testuser', email: 'test@email.com' }, 'currentUser$ debe contener el usuario mock');
      done(); // Para las dos subscripciones
    });
  });

  describe('logout()', () => {
    it('Should call authService.logout and show successful snackbar', () => {
      // el user hace clic en aceptar
      windowConfirmSpy.and.returnValue(true);
      // el logout es exitoso
      authService.logout.and.returnValue(of(null));
      component.logout();
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith('Sesión cerrada con éxito', '', { duration: 4000 });
    });

    it("Shouldn't call authService.logout if the user cancels the action", () => {
      // el user hace clic en cancelar
      windowConfirmSpy.and.returnValue(false);
      component.logout();
      expect(authService.logout).not.toHaveBeenCalled();
      expect(snackBar.open).not.toHaveBeenCalled();
    });
  });
});

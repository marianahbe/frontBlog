import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth';
import { UserRegister } from '../models/user-register.interface';
import { UserLogin, AuthResponse } from '../models/user-login.interface';
import { BehaviorSubject } from 'rxjs';
import { UserData } from '../models/user-login.interface';
import { Router } from '@angular/router';

const mockUserRegister: UserRegister = {
  email: 'testuser@email.com',
  username: 'testuser',
  password: '123456',
  passwordConf: '123456', 
};

const mockUserData: UserData = {
    id: 1,
    username: 'loggeduser',
    email: 'user@email.com',
    role: 'BLOGGER',
    team_id: 5,
    team_name: 'TeamA'
};

const mockAuthResponse: AuthResponse = {
  token: 'mock-token-123456',
  user_data: mockUserData,
};

describe('Auth', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const apiUrl = 'https://blogproject-hu3j.onrender.com/users/';

  // local storage
  let store: { [key: string]: string } = {};

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    // spyOn
    spyOn(localStorage, 'getItem').and.callFake((key: string): string | null => {
      return store[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): void => {
      store[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
      delete store[key];
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), 
        AuthService, // Proveer el servicio explícitamente
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService); 
    httpTestingController = TestBed.inject(HttpTestingController)
  });

  afterEach(() => {
    httpTestingController.verify();
    store = {};
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it ('should initialize isLoggedIn y user$ with localStorge', () => {
      store['token'] = mockAuthResponse.token;
      store['user_data'] = JSON.stringify(mockUserData);

      // para crear una nueva instancia LUEGO de agregar los datos, para que los pueda leer
      // si se quedara con el service de before each en lugar de volver a llamer el constructor
      // simplemente regresaría la instancia que ya se creó, donde los valores iniciales son false y null
      const httpClient = TestBed.inject(HttpClient);
      const manualService = new AuthService(httpClient, routerSpy);

      let loggedInState: boolean | undefined;
      let userState: any | null | undefined;

      manualService.isLoggedIn.subscribe(val => loggedInState = val).unsubscribe();
      manualService.user$.subscribe(val => userState = val).unsubscribe();

      expect(loggedInState).toBeTrue();
      expect(userState).toEqual(mockUserData);
    });
    
    it ('should initialize isLoggidIn false if the token is misssing', () => {
      store['user_data'] = JSON.stringify(mockUserData);

      const httpClient = TestBed.inject(HttpClient);
      const manualService = new AuthService(httpClient, routerSpy);

      let loggedInState: boolean | undefined;
      manualService.isLoggedIn.subscribe(val => loggedInState = val).unsubscribe();

      expect(loggedInState).toBeFalse();
    });
  });

  describe('registerUser', () => {
    it('it should send a POST request to the register Url', () => {
      service.registerUser(mockUserRegister).subscribe(response => {
        expect(response).toEqual({ success: true });
      });

      const req = httpTestingController.expectOne(`${apiUrl}register/`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(mockUserRegister);
      
      req.flush({ success: true });
    });
  });

  describe('loginUser', () => {
    it('should send POST save data in localStorage and update subjects', () => {
      const mockCredentials: UserLogin = { email: 'user@email.com', password: '123456' };
      
      // capturar los valores emitidos suscripciones activas
      let loggedInState: boolean | undefined;
      let userState: any | null | undefined;
      service.isLoggedIn.subscribe(val => loggedInState = val);
      service.user$.subscribe(val => userState = val);

      service.loginUser(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
      });

      const req = httpTestingController.expectOne(`${apiUrl}login/`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(mockCredentials);
      
      // activa el tap para actualizar el estado y localStorage
      req.flush(mockAuthResponse); 

      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockAuthResponse.token);
      expect(localStorage.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(mockUserData));
      
      // verificar Subjects
      expect(loggedInState).toBeTrue();
      expect(userState).toEqual(mockUserData);
      expect(userState?.role).toBe('BLOGGER');
      expect(userState?.team_name).toBe('TeamA');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // simular que el usuario está logeado antes de hacer logout
      store['token'] = mockAuthResponse.token;
      store['user_data'] = JSON.stringify(mockUserData);
      
      // resetear el servicio para que el constructor recoja el estado de login
      service = TestBed.inject(AuthService);
    });

    it('should send POST to logout, clear localStorage and update subjects', () => {
      let loggedInState: boolean | undefined;
      let userState: any | null | undefined;
      service.isLoggedIn.subscribe(val => loggedInState = val);
      service.user$.subscribe(val => userState = val);

      service.logout().subscribe(() => {
      });
      const req = httpTestingController.expectOne(`${apiUrl}logout/`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({});
      
      req.flush({});
      // revisar que localStorage se haya limpiado
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_data');
      
      // verificar Subjects
      expect(loggedInState).toBeFalse();
      expect(userState).toBeNull();
      
      // verificar que localStorage está vacío
      expect(store['token']).toBeUndefined();
      expect(store['user_data']).toBeUndefined();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('getUserInfo', () => {

    it("should return null if user_data doesn't exist", () => {
      expect((service as any).getUserInfo()).toBeNull();;
    });
    
    it('should return user_data if the object exists and is valid', () => {
        store['user_data'] = JSON.stringify(mockUserData);
        const user = (service as any).getUserInfo();
        expect(user).toEqual(mockUserData);
        expect(user.team_id).toBe(5);
    });

    it('should return null if user_data is not a valid JSON', () => {
        store['user_data'] = 'invalid json data';
        expect((service as any).getUserInfo()).toBeNull();
    });
  });
});

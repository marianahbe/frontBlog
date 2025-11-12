import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserRegister } from '../models/user-register.interface';
import { UserLogin, AuthResponse } from '../models/user-login.interface';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://blogproject-hu3j.onrender.com/users/';
  
  private loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isLoggedIn: Observable<boolean> = this.loggedIn.asObservable();

  private userSource$: BehaviorSubject<any | null> = new BehaviorSubject<any | null>(null);
  public user$: Observable<any | null> = this.userSource$.asObservable();

  constructor(private http: HttpClient){
    const userInfo = this.getUserInfo();
    const tokenExists = localStorage.getItem('token') !== null;
    this.loggedIn = new BehaviorSubject<boolean>(tokenExists && userInfo !== null); 
    this.isLoggedIn = this.loggedIn.asObservable();
    this.userSource$.next(this.getUserInfo());
  }

  registerUser(userData: UserRegister): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}register/`, userData);
  }

  loginUser(credentials: UserLogin): Observable<AuthResponse>{
    return this.http.post<AuthResponse>(`${this.apiUrl}login/`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user_data));
      
        console.log('Rol del usuario:', response.user_data.role);
        console.log('ID del Equipo:', response.user_data.team_id);
      
        this.loggedIn.next(true);
      this.userSource$.next(response.user_data);
      }),
    );
  }

  logout():Observable<any> {
    return this.http.post<any>(`${this.apiUrl}logout/`, {}).pipe(
      tap(() => {
        this.clearLocal();
      })
    )
  }

  clearLocal(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    this.loggedIn.next(false);
    this.userSource$.next(null);
  }

  private getUserInfo(): any | null {
    const user_data_str = localStorage.getItem('user_data');
    if (user_data_str) {
      try {
        return JSON.parse(user_data_str);
      } catch (error) {
        return null;
      }
    }
    return null; 
  }

}

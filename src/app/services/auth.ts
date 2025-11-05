import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRegister } from '../models/user-register.interface';
import { UserLogin, AuthResponse } from '../models/user-login.interface';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'https://blogproject-hu3j.onrender.com/users/';

  constructor(private http: HttpClient){ }

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
      })
    )
  }
}

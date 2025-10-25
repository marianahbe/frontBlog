import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRegister } from '../models/user-register.interface';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'https://blogproject-hu3j.onrender.com/users/register/';

  constructor(private http: HttpClient){ }

  registerUser(userData: UserRegister): Observable<any>{
    return this.http.post<any>(this.apiUrl, userData);
  }
}

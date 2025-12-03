import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { UserLogin } from '../models/user-login.interface';

import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit{
  loginForm!: FormGroup;
  passwordVisible: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar

  ){}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.authService.isLoggedIn.pipe(
      take(1) 
    ).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/posts']);
      } 
    })
  }

  togglePasswordVisibility(): void {
      this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    if (this.loginForm.valid){
      const credentials: UserLogin = this.loginForm.value;

      this.authService.loginUser(credentials).subscribe({
        next: (response) => {
          this.snackBar.open('Login exitoso', '', {
            duration: 4000,
          })
          this.router.navigate(['/posts']);
        },
        error: (error) => {
          let errorMessage = 'Error desconocido, por favor intenta de nuevo';
          const serverError = error.error?.non_field_errors?.[0];
          if (serverError === 'Invalid credentials.') {
            errorMessage = 'Credenciales inválidas, por favor verifica tu email y contraseña';
          }
          this.snackBar.open(errorMessage, '', {
            duration: 4000,
          });
        }
      });
    }
  }
}

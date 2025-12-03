import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { UserRegister } from '../models/user-register.interface';
import { passwordMatchValidator } from '../validator/password.validator';

import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Notificaciones

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})

export class Register implements OnInit{
  registerForm!: FormGroup; // instancia de la clase, asignación definitiva
  passwordVisible: boolean = false;
  passwordConfVisible: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ){}

  ngOnInit(): void{
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(emailPattern)]],
      password: ['', Validators.required],
      passwordConf: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  togglePasswordVisibility(): void {
      this.passwordVisible = !this.passwordVisible;
  }

  togglePasswordConfVisibility(): void {
      this.passwordConfVisible = !this.passwordConfVisible;
  }
  onSubmit(): void {
    if (this.registerForm.valid) {
      const userData: UserRegister = this.registerForm.value;
      
      this.authService.registerUser(userData).subscribe({
        next: (response) => {
          this.snackBar.open('Registro exitoso', '', {
            duration: 4000,
          })
          this.router.navigate(['/login']);
        },
        error: (error) => {
          const errorMessage = error.error ? JSON.stringify(error.error) : 'Error desconocido';
          this.snackBar.open(errorMessage, '', {
            duration: 4000,
          });
        }
      });
    } else {
      this.snackBar.open('Por favor revisa el formulario y las contraseñas.', '', {
        duration: 4000,
      });
    }
  }

  get passwordConfControl() {
    return this.registerForm.get('passwordConf');
  }
}



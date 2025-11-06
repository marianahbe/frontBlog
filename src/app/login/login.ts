import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserLogin } from '../models/user-login.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit{
  loginForm!: FormGroup;
  passwordVisible: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ){}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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
          console.log('Login exitoso, se guardó el token', response);
          this.router.navigate(['/posts']);
        },
        error: (error) => {
          console.error('Error en el login', error);
          alert('Error de autenticación, revisa el usuario y contraseña')
        }
      });
    }
  }
}

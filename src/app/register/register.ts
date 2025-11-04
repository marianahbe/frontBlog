import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { UserRegister } from '../models/user-register.interface';
import { passwordMatchValidator } from '../validator/password.validator';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})

export class Register implements OnInit{
  registerForm!: FormGroup; // instancia de la clase, asignación definitiva
  passwordVisible: boolean = false;
  passwordConfVisible: boolean = false;


  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ){}

  ngOnInit(): void{
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
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
          console.log('Registro exitoso', response);
          alert('Usuario registrado con éxito');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error en el registro', error);
          alert('Error:' + JSON.stringify(error.error));
        }
      });
    } else {
      console.log('Formulario inválido o contraseñas no coinciden');
    }
  }

  get passwordConfControl() {
    return this.registerForm.get('passwordConf');
  }
}


import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isLoggedIn$!: Observable<boolean>;
  currentUser$!: Observable<any | null>;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn;
    this.currentUser$ = this.authService.currentUser;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

}

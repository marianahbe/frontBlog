import { Routes } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { Posts } from './posts/posts';

export const routes: Routes = [
    { path: 'register', component: Register},
    { path: 'login', component: Login},
    { path: 'posts', component: Posts},
    { path: '', redirectTo: '/register', pathMatch: 'full' } 
];


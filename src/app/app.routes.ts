import { Routes } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { Posts } from './posts/posts';
import { PostDetails } from './post-details/post-details';

export const routes: Routes = [
    { path: 'register', component: Register},
    { path: 'login', component: Login},
    { path: 'posts', component: Posts},
    { path: 'post/:id', component: PostDetails},
    { path: '', redirectTo: '/posts', pathMatch: 'full' } 
];


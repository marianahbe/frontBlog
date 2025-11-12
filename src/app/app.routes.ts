import { Routes } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { Posts } from './posts/posts';
import { PostDetails } from './post-details/post-details';
import { PostCreate } from './post-create/post-create';

export const routes: Routes = [
    { path: 'register', component: Register},
    { path: 'login', component: Login},
    { path: 'posts', component: Posts},
    { path: 'post/:id', component: PostDetails},
    { path: 'post', component: PostCreate},
    { path: '', redirectTo: '/posts', pathMatch: 'full' } 
];


import { Routes } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { Posts } from './posts/posts';
import { PostDetails } from './post-details/post-details';
import { PostCreate } from './post-create/post-create';
import { PostEdit } from './post-edit/post-edit';

export const routes: Routes = [
    { path: 'register', component: Register},
    { path: 'login', component: Login},
    { path: 'posts/create', component: PostCreate},
    { path: 'posts/:id/edit', component: PostEdit },
    { path: 'posts/:id', component: PostDetails},
    { path: 'posts', component: Posts},
    { path: '', redirectTo: '/posts', pathMatch: 'full' } 
];


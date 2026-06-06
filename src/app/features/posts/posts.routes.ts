import { Routes } from '@angular/router';
import { PostsCrud } from './pages/posts-crud/posts-crud';
import { PostsForm } from './pages/posts-form/posts-form';

export default [
    { path: 'new', component: PostsForm },
    { path: ':id/edit', component: PostsForm },
    { path: '', component: PostsCrud }
] as Routes;

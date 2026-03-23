import { Routes } from '@angular/router';
import { CoursesCrud } from './pages/courses-crud/courses-crud';
import { CoursesForm } from './pages/courses-form/courses-form.js';

export default [
    { path: 'new', component: CoursesForm },
    { path: ':id/edit', component: CoursesForm },
    { path: '', component: CoursesCrud }
] as Routes;

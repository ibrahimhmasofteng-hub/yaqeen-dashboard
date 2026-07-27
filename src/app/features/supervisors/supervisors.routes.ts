import { Routes } from '@angular/router';
import { SupervisorsCrud } from './pages/supervisors-crud/supervisors-crud';
import { SupervisorCourses } from './pages/supervisor-courses/supervisor-courses';

export default [
    { path: ':id/courses', component: SupervisorCourses },
    { path: '', component: SupervisorsCrud }
] as Routes;

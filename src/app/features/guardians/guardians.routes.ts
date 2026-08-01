import { Routes } from '@angular/router';
import { GuardiansCrud } from './pages/guardians-crud/guardians-crud';
import { GuardianStudents } from './pages/guardian-students/guardian-students';

export default [
    { path: '', component: GuardiansCrud },
    { path: ':id/students', component: GuardianStudents }
] as Routes;

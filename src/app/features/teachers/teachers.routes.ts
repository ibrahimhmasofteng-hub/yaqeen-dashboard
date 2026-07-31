import { Routes } from '@angular/router';
import { TeachersCrud } from './pages/teachers-crud/teachers-crud';
import { TeacherCourses } from './pages/teacher-courses/teacher-courses';
import { TeacherGroups } from './pages/teacher-groups/teacher-groups';

export default [
    { path: '', component: TeachersCrud },
    { path: ':id/courses', component: TeacherCourses },
    { path: ':id/groups', component: TeacherGroups }
] as Routes;

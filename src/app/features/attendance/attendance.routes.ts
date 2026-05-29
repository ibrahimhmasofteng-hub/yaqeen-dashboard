import { Routes } from '@angular/router';
import { AttendanceRecording } from './pages/attendance-recording/attendance-recording';

export default [
    { path: 'record', component: AttendanceRecording },
    { path: '', redirectTo: 'record', pathMatch: 'full' }
] as Routes;

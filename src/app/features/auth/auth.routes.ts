import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Access } from './access';
import { CompleteRegistration } from './complete-registration';
import { Login } from './login';
import { Error } from './error';
import { AuthService } from '@/app/core/services/auth.service';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';

const redirectIfAuthenticated = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return true;

    const status = auth.user()?.accountStatus;
    if (status === AccountStatus.COMPLETE_REGISTRATION_REQUIRED) {
        router.navigate(['/auth/complete-registration']);
        return false;
    }

    router.navigate(['/']);
    return false;
};

const allowOnlyCompleteRegistration = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
        router.navigate(['/auth/login']);
        return false;
    }

    const status = auth.user()?.accountStatus;
    if (status !== AccountStatus.COMPLETE_REGISTRATION_REQUIRED) {
        router.navigate(['/']);
        return false;
    }

    return true;
};

export default [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'access', component: Access, canActivate: [redirectIfAuthenticated] },
    { path: 'error', component: Error, canActivate: [redirectIfAuthenticated] },
    { path: 'login', component: Login, canActivate: [redirectIfAuthenticated] },
    { path: 'complete-registration', component: CompleteRegistration, canActivate: [allowOnlyCompleteRegistration] }
] as Routes;

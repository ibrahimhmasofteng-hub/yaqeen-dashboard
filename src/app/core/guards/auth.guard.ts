import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
        router.navigate(['/auth/login']);
        return false;
    }

    const status = auth.user()?.accountStatus;
    if (status === AccountStatus.COMPLETE_REGISTRATION_REQUIRED) {
        router.navigate(['/auth/complete-registration']);
        return false;
    }

    return true;
};

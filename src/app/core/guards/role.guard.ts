import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '@/app/core/services/token.service';
import { User } from '@/app/core/models/auth.model';

export const roleGuard: CanActivateFn = (route) => {
    const tokens = inject(TokenService);
    const router = inject(Router);

    const required = route.data?.['roles'] as string[] | undefined;
    if (!required || required.length === 0) return true;

    const user = tokens.getUser<User>();
    const roles = new Set<string>();
    if (user?.role) roles.add(String(user.role));
    if (Array.isArray(user?.roles)) {
        user.roles.forEach((role) => roles.add(String(role)));
    }

    const allowed = required.some((role) => roles.has(role));
    if (allowed) return true;

    router.navigate(['/not-authorized']);
    return false;
};

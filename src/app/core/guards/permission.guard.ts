import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '@/app/core/services/permission.service';

export const permissionGuard: CanActivateFn = (route) => {
    const permissions = inject(PermissionService);
    const router = inject(Router);

    const required = route.data?.['permission'] as string | undefined;
    const anyOf = route.data?.['permissionsAny'] as string[] | undefined;
    const allOf = route.data?.['permissionsAll'] as string[] | undefined;

    if (required && permissions.has(required)) return true;
    if (Array.isArray(anyOf) && anyOf.length && permissions.hasAny(...anyOf)) return true;
    if (Array.isArray(allOf) && allOf.length && permissions.hasAll(...allOf)) return true;
    if (!required && !anyOf && !allOf) return true;

    router.navigate(['/not-authorized']);
    return false;
};

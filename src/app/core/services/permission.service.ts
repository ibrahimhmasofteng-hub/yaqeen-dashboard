import { Injectable } from '@angular/core';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
    private permissionsLoaded = false;

    constructor(private tokens: TokenService) {
        const perms = this.tokens.getPermissions();
        this.permissionsLoaded = perms.length > 0;
    }

    setPermissionsLoaded(loaded: boolean): void {
        this.permissionsLoaded = loaded;
    }

    reset(): void {
        this.permissionsLoaded = false;
    }

    has(permission: string): boolean {
        const perms = this.tokens.getPermissions();
        if (!this.permissionsLoaded) return false;
        return perms.includes(permission);
    }

    hasAny(...permissions: string[]): boolean {
        const perms = this.tokens.getPermissions();
        if (!this.permissionsLoaded) return false;
        return permissions.some((p) => perms.includes(p));
    }

    hasAll(...permissions: string[]): boolean {
        const perms = this.tokens.getPermissions();
        if (!this.permissionsLoaded) return false;
        return permissions.every((p) => perms.includes(p));
    }
}

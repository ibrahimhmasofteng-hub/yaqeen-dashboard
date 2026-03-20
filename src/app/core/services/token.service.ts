import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user';
const PERMISSIONS_KEY = 'permissions';

@Injectable({ providedIn: 'root' })
export class TokenService {
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    }

    clearToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_KEY);
    }

    setRefreshToken(token: string): void {
        localStorage.setItem(REFRESH_KEY, token);
    }

    clearRefreshToken(): void {
        localStorage.removeItem(REFRESH_KEY);
    }

    getUser<T = unknown>(): T | null {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as T) : null;
    }

    setUser(user: unknown): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    clearUser(): void {
        localStorage.removeItem(USER_KEY);
    }

    getPermissions(): string[] {
        const raw = localStorage.getItem(PERMISSIONS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    }

    setPermissions(perms: string[]): void {
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
    }

    clearPermissions(): void {
        localStorage.removeItem(PERMISSIONS_KEY);
    }

    clearAll(): void {
        this.clearToken();
        this.clearRefreshToken();
        this.clearUser();
        this.clearPermissions();
    }
}

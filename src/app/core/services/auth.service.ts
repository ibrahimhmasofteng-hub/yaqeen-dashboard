import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { PermissionService } from './permission.service';
import { AuthResponse, User } from '@/app/core/models/auth.model';

export interface LoginPayload {
    username: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(ApiService);
    private tokens = inject(TokenService);
    private permissions = inject(PermissionService);
    private router = inject(Router);
    private loggingOut = false;

    user = signal<User | null>(this.tokens.getUser<User>());

    login(payload: LoginPayload): Observable<AuthResponse> {
        return this.api.post<unknown>('authentication/login', payload).pipe(
            tap((res: any) => {
                const data = res && typeof res === 'object' && 'data' in res ? (res as any).data : res;
                this.setSession(data as AuthResponse);
            })
        ) as Observable<AuthResponse>;
    }

    refreshToken(): Observable<AuthResponse> {
        const refresh = this.tokens.getRefreshToken();
        return this.api.post<AuthResponse>('refresh', { refreshToken: refresh }).pipe(
            tap((res) => this.setSession(res))
        );
    }

    completeRegistration(password: string): Observable<User> {
        return this.api.post<User>('actors/complete-registration', { password }).pipe(
            tap((user) => {
                if (user) {
                    this.tokens.setUser(user);
                    this.user.set(user);
                }
            })
        );
    }

    logout(redirectToLogin: boolean = true): void {
        if (this.loggingOut) {
            this.finishLogout(redirectToLogin);
            return;
        }
        const token = this.tokens.getToken();
        if (!token) {
            this.finishLogout(redirectToLogin);
            return;
        }
        this.loggingOut = true;
        this.api.post<unknown>('logout', {}).subscribe({
            next: () => {
                this.finishLogout(redirectToLogin);
            },
            error: () => {
                this.finishLogout(redirectToLogin);
            }
        });
    }

    isAuthenticated(): boolean {
        return !!this.tokens.getToken();
    }

    private setSession(res: AuthResponse): void {
        const token = res.token || res.accessToken;
        if (token) {
            this.tokens.setToken(token);
        }

        if (res.refreshToken) {
            this.tokens.setRefreshToken(res.refreshToken);
        }

        const user = res.user ?? (res.actor ? { ...res.actor, name: res.actor.fullName } : undefined);
        if (user) {
            this.tokens.setUser(user);
            this.user.set(user);
        }

        if (Array.isArray(res.permissions)) {
            this.tokens.setPermissions(res.permissions);
            this.permissions.setPermissionsLoaded(true);
        } else {
            this.permissions.setPermissionsLoaded(false);
        }
    }

    private finishLogout(redirectToLogin: boolean): void {
        this.loggingOut = false;
        this.tokens.clearAll();
        this.permissions.setPermissionsLoaded(false);
        this.user.set(null);
        if (redirectToLogin) {
            this.router.navigate(['/auth/login']);
        }
    }

    logoutLocal(redirectToLogin: boolean = true): void {
        this.finishLogout(redirectToLogin);
    }
}

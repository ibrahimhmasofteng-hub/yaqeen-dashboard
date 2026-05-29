import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/core/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notify = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                if (req.url.includes('/login')) {
                    return throwError(() => error);
                }
                auth.logoutLocal(false);
                router.navigate(['/auth/login']);
      } else {
        const raw = error.error?.message;
        let message: string;
        if (Array.isArray(raw) && raw.length > 0 && raw[0].property && raw[0].errors) {
            message = raw.map((e: { property: string; errors: string[] }) =>
                `${e.property}: ${e.errors.join(', ')}`
            ).join('\n');
        } else if (typeof raw === 'string' && raw.length > 0) {
            message = raw;
        } else if (raw !== undefined && raw !== null) {
            message = JSON.stringify(raw);
        } else {
            message = error.message || 'Unexpected error';
        }
        notify.error(message);
      }

            return throwError(() => error);
        })
    );
};

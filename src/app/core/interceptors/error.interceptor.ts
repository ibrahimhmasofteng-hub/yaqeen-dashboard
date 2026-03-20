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
        const message = raw !== undefined ? JSON.stringify(raw) : error.message || 'Unexpected error';
        notify.error(message);
      }

            return throwError(() => error);
        })
    );
};

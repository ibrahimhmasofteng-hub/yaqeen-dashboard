import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@/app/core/services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokens = inject(TokenService);
    const token = tokens.getToken();

    if (!token) return next(req);

    const authReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(authReq);
};

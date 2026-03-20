import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export interface RequestOptions {
    params?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    headers?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = inject(API_BASE_URL).replace(/\/$/, '');

    get<T>(path: string, options: RequestOptions = {}): Observable<T> {
        return this.http.get<T>(this.buildUrl(path), {
            params: this.buildParams(options.params),
            headers: options.headers
        });
    }

    post<T>(path: string, body?: unknown, options: RequestOptions = {}): Observable<T> {
        return this.http.post<T>(this.buildUrl(path), body ?? options.body, {
            params: this.buildParams(options.params),
            headers: options.headers
        });
    }

    put<T>(path: string, body?: unknown, options: RequestOptions = {}): Observable<T> {
        return this.http.put<T>(this.buildUrl(path), body ?? options.body, {
            params: this.buildParams(options.params),
            headers: options.headers
        });
    }

    patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Observable<T> {
        return this.http.patch<T>(this.buildUrl(path), body ?? options.body, {
            params: this.buildParams(options.params),
            headers: options.headers
        });
    }

    delete<T>(path: string, options: RequestOptions = {}): Observable<T> {
        return this.http.delete<T>(this.buildUrl(path), {
            params: this.buildParams(options.params),
            headers: options.headers
        });
    }

    private buildUrl(path: string): string {
        const clean = path.startsWith('/') ? path.slice(1) : path;
        return `${this.baseUrl}/${clean}`;
    }

    private buildParams(params?: Record<string, string | number | boolean | undefined | null>): HttpParams | undefined {
        if (!params) return undefined;
        let httpParams = new HttpParams();
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null) continue;
            httpParams = httpParams.set(key, String(value));
        }
        return httpParams;
    }
}

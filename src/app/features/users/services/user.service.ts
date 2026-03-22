import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { User, UserProfile, UsersListResponse } from '@/app/features/users/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, role?: string): Observable<UsersListResponse> {
        const params = {
            page,
            perPage,
            ...(role ? { role } : {})
        };
        return this.api.get<UsersListResponse>('actors', { params });
    }

    get(id: string | number): Observable<User> {
        return this.api.get<User>(`actors/${id}`);
    }

    create(payload: {
        username: string;
        password: string;
        email: string;
        phone?: string;
        accountStatus?: string;
        roleId?: string;
        profile?: UserProfile;
    }): Observable<User> {
        return this.api.post<User>('actors', payload);
    }

    update(id: string | number, payload: {
        username?: string;
        password?: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId?: string;
        profile?: UserProfile;
    }): Observable<User> {
        return this.api.patch<User>(`actors/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`actors/${id}`);
    }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Teacher, TeacherProfile, TeachersListResponse } from '@/app/features/teachers/models/teacher.model';

@Injectable({ providedIn: 'root' })
export class TeacherService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, role?: string): Observable<TeachersListResponse> {
        const params = {
            page,
            perPage,
            ...(role ? { role } : {})
        };
        return this.api.get<TeachersListResponse>('actors', { params });
    }

    get(id: string | number): Observable<Teacher> {
        return this.api.get<Teacher>(`actors/${id}`);
    }

    create(payload: {
        username: string;
        password: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId: string;
        profile: TeacherProfile;
    }): Observable<Teacher> {
        return this.api.post<Teacher>('actors', payload);
    }

    update(id: string | number, payload: {
        username?: string;
        password?: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId?: string;
        profile?: TeacherProfile;
    }): Observable<Teacher> {
        return this.api.patch<Teacher>(`actors/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`actors/${id}`);
    }
}

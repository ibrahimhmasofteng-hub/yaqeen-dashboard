import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Student, StudentProfile, StudentsListResponse } from '@/app/features/students/models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number): Observable<StudentsListResponse> {
        return this.api.get<StudentsListResponse>('actors', { params: { page, perPage } });
    }

    get(id: string | number): Observable<Student> {
        return this.api.get<Student>(`actors/${id}`);
    }

    create(payload: {
        username: string;
        password: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId: string;
        profile: StudentProfile;
    }): Observable<Student> {
        return this.api.post<Student>('actors', payload);
    }

    update(id: string | number, payload: {
        username?: string;
        password?: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId?: string;
        profile?: StudentProfile;
    }): Observable<Student> {
        return this.api.patch<Student>(`actors/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`actors/${id}`);
    }
}

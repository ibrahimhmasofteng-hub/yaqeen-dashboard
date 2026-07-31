import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Student, StudentProfile, StudentsListResponse, StudentCoursesResponse } from '@/app/features/students/models/student.model';
import { RoleName } from '@/app/core/constants/role-name.enum';

export interface ActorFilters {
    role?: string;
    name?: string;
    accountStatus?: string;
    sort?: { field: string; direction: 'asc' | 'desc' };
}

export function buildActorParams(page: number, perPage: number, f?: ActorFilters): Record<string, string | number | boolean | undefined> {
    return {
        page, perPage,
        ...(f?.role ? { role: f.role } : {}),
        ...(f?.name ? { name: f.name } : {}),
        ...(f?.accountStatus ? { accountStatus: f.accountStatus } : {}),
        ...(f?.sort ? { sort: JSON.stringify({ field: f.sort.field, direction: f.sort.direction }) } : {})
    };
}

@Injectable({ providedIn: 'root' })
export class StudentService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: ActorFilters): Observable<StudentsListResponse> {
        return this.api.get<StudentsListResponse>('actors', { params: buildActorParams(page, perPage, filters) });
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

    listGuardians(page: number, perPage: number): Observable<StudentsListResponse> {
        return this.api.get<StudentsListResponse>('actors', { params: buildActorParams(page, perPage, { role: RoleName.Guardian }) });
    }

    getStudentCourses(studentId: string): Observable<StudentCoursesResponse> {
        return this.api.get<StudentCoursesResponse>(`statistics/student/${studentId}/courses`);
    }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Teacher, TeacherProfile, TeachersListResponse, TeacherOverviewResponse, TeacherGroupsResponse } from '@/app/features/teachers/models/teacher.model';
import { ActorFilters, buildActorParams } from '@/app/features/students/services/student.service';

@Injectable({ providedIn: 'root' })
export class TeacherService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: ActorFilters): Observable<TeachersListResponse> {
        return this.api.get<TeachersListResponse>('actors', { params: buildActorParams(page, perPage, filters) });
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

    getOverview(teacherId: string): Observable<TeacherOverviewResponse> {
        return this.api.get<TeacherOverviewResponse>(`statistics/teacher/${teacherId}/overview`);
    }

    getGroups(teacherId: string, page: number = 1, perPage: number = 10): Observable<TeacherGroupsResponse> {
        return this.api.get<TeacherGroupsResponse>(`group-teachers/by-teacher/${teacherId}`, { params: { page, perPage } });
    }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Supervisor, SupervisorProfile, SupervisorsListResponse, SupervisorCoursesResponse } from '@/app/features/supervisors/models/supervisor.model';
import { ActorFilters, buildActorParams } from '@/app/features/students/services/student.service';

@Injectable({ providedIn: 'root' })
export class SupervisorService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: ActorFilters): Observable<SupervisorsListResponse> {
        return this.api.get<SupervisorsListResponse>('actors', { params: buildActorParams(page, perPage, filters) });
    }

    get(id: string | number): Observable<Supervisor> {
        return this.api.get<Supervisor>(`actors/${id}`);
    }

    create(payload: {
        username: string;
        password: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId: string;
        profile: SupervisorProfile;
    }): Observable<Supervisor> {
        return this.api.post<Supervisor>('actors', payload);
    }

    update(id: string | number, payload: {
        username?: string;
        password?: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        roleId?: string;
        profile?: SupervisorProfile;
    }): Observable<Supervisor> {
        return this.api.patch<Supervisor>(`actors/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`actors/${id}`);
    }

    getCourses(supervisorId: string): Observable<SupervisorCoursesResponse> {
        return this.api.get<SupervisorCoursesResponse>(`statistics/supervisor/${supervisorId}/courses`);
    }
}

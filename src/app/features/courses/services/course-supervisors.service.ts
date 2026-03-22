import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface CourseSupervisorAssignment {
    id?: string;
    assignedAt?: string;
    actorId?: string;
    courseId?: string;
    actor?: {
        id?: string;
        username?: string;
        email?: string;
        phone?: string;
        accountStatus?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
}

export interface CourseSupervisorsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface CourseSupervisorsResponse {
    data: CourseSupervisorAssignment[];
    meta: CourseSupervisorsMeta;
}

@Injectable({ providedIn: 'root' })
export class CourseSupervisorsService {
    private api: ApiService = inject(ApiService);

    assign(courseId: string | number, supervisorIds: string[]): Observable<unknown> {
        return this.api.put<unknown>(`course-supervisors/${courseId}`, { supervisorIds });
    }

    listByCourse(courseId: string | number, page = 1, perPage = 100): Observable<CourseSupervisorsResponse> {
        return this.api.get<CourseSupervisorsResponse>(`course-supervisors/by-course/${courseId}`, {
            params: { page, perPage }
        });
    }
}

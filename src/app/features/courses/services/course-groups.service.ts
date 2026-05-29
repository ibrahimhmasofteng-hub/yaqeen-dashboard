import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface CourseGroup {
    id: string;
    name: string;
    courseId: string;
    courseName?: string;
    studentCount?: number;
    teacherCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CourseGroupsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface CourseGroupsResponse {
    data: CourseGroup[];
    meta: CourseGroupsMeta;
}

@Injectable({ providedIn: 'root' })
export class CourseGroupsService {
    private api: ApiService = inject(ApiService);

    create(payload: { name: string; courseId: string }): Observable<CourseGroup> {
        return this.api.post<CourseGroup>('course-groups', payload);
    }

    get(id: string | number): Observable<CourseGroup> {
        return this.api.get<CourseGroup>(`course-groups/${id}`);
    }

    update(id: string | number, payload: { name?: string }): Observable<CourseGroup> {
        return this.api.patch<CourseGroup>(`course-groups/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`course-groups/${id}`);
    }

    listByCourse(courseId: string | number, page = 1, perPage = 10): Observable<CourseGroupsResponse> {
        return this.api.get<CourseGroupsResponse>(`course-groups/by-course/${courseId}`, { params: { page, perPage } });
    }

    list(page = 1, perPage = 100): Observable<CourseGroupsResponse> {
        return this.api.get<CourseGroupsResponse>('course-groups', { params: { page, perPage } });
    }
}

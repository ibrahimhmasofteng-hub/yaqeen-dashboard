import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Course, CourseTime, CoursesListResponse } from '@/app/features/courses/models/course.model';
import { CourseType } from '@/app/features/courses/models/course-type.enum';
import { WeekDay } from '@/app/features/courses/models/week-day.enum';

export interface CourseFilters {
    name?: string;
    type?: string;
    isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: CourseFilters): Observable<CoursesListResponse> {
        const params: Record<string, string | number | boolean | undefined> = {
            page, perPage,
            ...(filters?.name ? { name: filters.name } : {}),
            ...(filters?.type ? { type: filters.type } : {}),
            ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {})
        };
        return this.api.get<CoursesListResponse>('courses', { params });
    }

    get(id: string | number): Observable<Course> {
        return this.api.get<Course>(`courses/${id}`);
    }

    create(payload: {
        name: string;
        type: CourseType;
        startDate: string;
        endDate: string;
        note?: string;
        times?: Array<{ day: WeekDay; startHour: number; endHour: number }>;
    }): Observable<Course> {
        return this.api.post<Course>('courses', payload);
    }

    update(
        id: string | number,
        payload: {
            name?: string;
            type?: CourseType;
            startDate?: string;
            endDate?: string;
            note?: string;
            times?: Array<{ day: WeekDay; startHour: number; endHour: number }>;
        }
    ): Observable<Course> {
        return this.api.patch<Course>(`courses/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`courses/${id}`);
    }
}

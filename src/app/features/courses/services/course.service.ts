import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Course, CourseTime, CoursesListResponse } from '@/app/features/courses/models/course.model';
import { CourseType } from '@/app/features/courses/models/course-type.enum';
import { WeekDay } from '@/app/features/courses/models/week-day.enum';

@Injectable({ providedIn: 'root' })
export class CourseService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number): Observable<CoursesListResponse> {
        return this.api.get<CoursesListResponse>('courses', { params: { page, perPage } });
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

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { CourseGroupsListResponse } from '@/app/features/course-groups/models/course-group.model';

@Injectable({ providedIn: 'root' })
export class CourseGroupsListService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: { name?: string }): Observable<CourseGroupsListResponse> {
        const params: Record<string, string | number | undefined> = {
            page, perPage,
            ...(filters?.name ? { name: filters.name } : {})
        };
        return this.api.get<CourseGroupsListResponse>('course-groups', { params });
    }
}

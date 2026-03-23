import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { CourseGroupsListResponse } from '@/app/features/course-groups/models/course-group.model';

@Injectable({ providedIn: 'root' })
export class CourseGroupsListService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number): Observable<CourseGroupsListResponse> {
        return this.api.get<CourseGroupsListResponse>('course-groups', { params: { page, perPage } });
    }
}

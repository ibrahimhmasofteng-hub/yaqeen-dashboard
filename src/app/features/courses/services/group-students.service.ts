import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface GroupStudentItem {
    id: string;
    groupId: string;
    studentId: string;
    enrolledAt?: string;
    student?: {
        id?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
}

export interface GroupStudentsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface GroupStudentsResponse {
    data: GroupStudentItem[];
    meta: GroupStudentsMeta;
}

@Injectable({ providedIn: 'root' })
export class GroupStudentsService {
    private api: ApiService = inject(ApiService);

    assign(groupId: string, studentIds: string[]): Observable<unknown> {
        return this.api.put<unknown>(`group-students/${groupId}`, { studentIds });
    }

    listByGroup(groupId: string | number, page = 1, perPage = 10): Observable<GroupStudentsResponse> {
        return this.api.get<GroupStudentsResponse>(`group-students/by-group/${groupId}`, { params: { page, perPage } });
    }
}

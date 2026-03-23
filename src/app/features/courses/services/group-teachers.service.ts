import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { GroupTeacherType } from '@/app/features/courses/models/group-teacher-type.enum';

export interface GroupTeacherAssignment {
    teacherId: string;
    type: GroupTeacherType;
}

export interface GroupTeacherItem {
    id: string;
    groupId: string;
    teacherId: string;
    assignedAt?: string;
    type?: GroupTeacherType;
    teacher?: {
        id?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
}

export interface GroupTeachersMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface GroupTeachersResponse {
    data: GroupTeacherItem[];
    meta: GroupTeachersMeta;
}

@Injectable({ providedIn: 'root' })
export class GroupTeachersService {
    private api: ApiService = inject(ApiService);

    assign(groupId: string, teachers: GroupTeacherAssignment[]): Observable<unknown> {
        return this.api.put<unknown>(`group-teachers/${groupId}`, { teachers });
    }

    listByGroup(groupId: string | number, page = 1, perPage = 10): Observable<GroupTeachersResponse> {
        return this.api.get<GroupTeachersResponse>(`group-teachers/by-group/${groupId}`, { params: { page, perPage } });
    }
}

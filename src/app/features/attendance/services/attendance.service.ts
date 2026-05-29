import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import {
    AttendanceEntity,
    AttendanceListResponse,
    CreateAttendanceDTO,
    UpdateAttendanceDTO,
    AttendanceFilterParams
} from '@/app/features/attendance/models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    private api: ApiService = inject(ApiService);

    create(data: CreateAttendanceDTO): Observable<AttendanceEntity> {
        return this.api.post<AttendanceEntity>('attendances', data);
    }

    list(params?: AttendanceFilterParams): Observable<AttendanceListResponse> {
        return this.api.get<AttendanceListResponse>('attendances', { params: params as any });
    }

    get(id: string): Observable<AttendanceEntity> {
        return this.api.get<AttendanceEntity>(`attendances/${id}`);
    }

    update(id: string, data: UpdateAttendanceDTO): Observable<AttendanceEntity> {
        return this.api.patch<AttendanceEntity>(`attendances/${id}`, data);
    }

    delete(id: string): Observable<unknown> {
        return this.api.delete<unknown>(`attendances/${id}`);
    }
}

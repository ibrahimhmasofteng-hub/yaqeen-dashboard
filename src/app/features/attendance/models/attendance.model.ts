import { AttendanceStatus } from './attendance-status.enum';

export interface CreateAttendanceDTO {
    courseId: string;
    groupId: string;
    studentId: string;
    status: AttendanceStatus;
    attendedAt: string;
    notes?: string;
}

export interface UpdateAttendanceDTO {
    status?: AttendanceStatus;
    attendedAt?: string;
    notes?: string;
}

export interface AttendanceEntity {
    id: string;
    notes: string | null;
    status: AttendanceStatus;
    attendedAt: string | null;
    course?: { id?: string; name?: string };
    group?: { id?: string; name?: string };
    student?: { id?: string; username?: string; profile?: { firstName?: string; lastName?: string } };
    createdAt?: string;
    updatedAt?: string;
}

export interface AttendanceFilterParams {
    page?: number;
    perPage?: number;
    courseId?: string;
    groupId?: string;
    studentId?: string;
    status?: string;
    attendedAtStartDate?: string;
    attendedAtEndDate?: string;
}

export interface AttendanceMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: null;
    total: number;
}

export interface AttendanceListResponse {
    data: AttendanceEntity[];
    meta: AttendanceMeta;
}

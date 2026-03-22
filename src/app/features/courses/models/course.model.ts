import { CourseType } from './course-type.enum';
import { WeekDay } from './week-day.enum';

export interface CourseTime {
    id?: string | number;
    day?: WeekDay;
    startHour?: number;
    endHour?: number;
    courseId?: string | number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Course {
    id?: string | number;
    name?: string;
    type?: CourseType;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
    times?: CourseTime[];
}

export interface CoursesMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface CoursesListResponse {
    data: Course[];
    meta: CoursesMeta;
}

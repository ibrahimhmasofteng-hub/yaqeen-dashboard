export interface CourseGroup {
    id?: string | number;
    name?: string;
    courseId?: string | number;
    courseName?: string;
    course?: {
        id?: string | number;
        name?: string;
    };
    teachersCount?: number;
    studentsCount?: number;
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

export interface CourseGroupsListResponse {
    data: CourseGroup[];
    meta: CourseGroupsMeta;
}

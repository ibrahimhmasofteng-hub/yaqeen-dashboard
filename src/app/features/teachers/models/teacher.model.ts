export interface TeacherImage {
    id?: string;
    url?: string;
    fileName?: string;
    type?: string;
    size?: number;
}

export interface TeacherProfile {
    id?: string;
    firstName?: string;
    lastName?: string;
    midName?: string;
    additionalName?: string;
    birthDate?: string;
    birthPlace?: string;
    nationalId?: string;
    imageId?: string;
    job?: string;
    education?: string;
    address?: string;
    distinguishingSigns?: string;
    note?: string;
    image?: TeacherImage;
}

export interface Teacher {
    id: string;
    username: string;
    email?: string;
    phone?: string;
    accountStatus?: string;
    roleId?: string;
    profile?: TeacherProfile;
    createdAt?: string;
}

export interface TeachersMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface TeachersListResponse {
    data: Teacher[];
    meta: TeachersMeta;
}

export interface TeacherCourseSummary {
    courseId: string;
    courseName: string;
    groupCount: number;
    studentsAssigned: number;
    recitationsAssessed: number;
}

export interface TeacherOverviewResponse {
    courses: TeacherCourseSummary[];
    totalRecitationsAssessed: number;
    evaluationDistribution: Record<string, number>;
}

export interface TeacherGroupAssignment {
    id: string;
    groupId: string;
    teacherId: string;
    assignedAt: string;
    type: 'MAIN' | 'ASSISTANT';
    teacher?: any;
}

export interface TeacherGroupsResponse {
    data: TeacherGroupAssignment[];
    meta: {
        page: number;
        perPage: number;
        nextPage: number | null;
        previousPage: number | null;
        total: number;
    };
}

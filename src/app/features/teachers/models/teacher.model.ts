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

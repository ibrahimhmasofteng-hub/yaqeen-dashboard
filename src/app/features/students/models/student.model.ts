export interface StudentImage {
    id?: string;
    url?: string;
    fileName?: string;
    type?: string;
    size?: number;
}

export interface StudentProfile {
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
    image?: StudentImage;
}

export interface Student {
    id: string;
    username: string;
    email?: string;
    phone?: string;
    accountStatus?: string;
    roleId?: string;
    profile?: StudentProfile;
    createdAt?: string;
}

export interface StudentsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface StudentsListResponse {
    data: Student[];
    meta: StudentsMeta;
}

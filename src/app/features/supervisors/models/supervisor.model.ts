export interface SupervisorImage {
    id?: string;
    url?: string;
    fileName?: string;
    type?: string;
    size?: number;
}

export interface SupervisorProfile {
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
    image?: SupervisorImage;
}

export interface Supervisor {
    id: string;
    username: string;
    email?: string;
    phone?: string;
    accountStatus?: string;
    roleId?: string;
    profile?: SupervisorProfile;
    createdAt?: string;
}

export interface SupervisorsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface SupervisorsListResponse {
    data: Supervisor[];
    meta: SupervisorsMeta;
}

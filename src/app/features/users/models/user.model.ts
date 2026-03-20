export interface UserImage {
    id?: string;
    url?: string;
    fileName?: string;
    type?: string;
    size?: number;
}

export interface UserProfile {
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
    image?: UserImage;
}

export interface User {
    id: string;
    username: string;
    email: string;
    phone?: string;
    accountStatus?: string;
    roleId?: string;
    profile?: UserProfile;
    createdAt?: string;
}

export interface UsersMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface UsersListResponse {
    data: User[];
    meta: UsersMeta;
}

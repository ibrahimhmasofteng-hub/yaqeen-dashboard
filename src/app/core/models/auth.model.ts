export interface User {
    id?: string | number;
    email?: string;
    name?: string;
    fullName?: string;
    phone?: string;
    accountStatus?: string;
    nationalId?: string;
    createdAt?: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
    [key: string]: unknown;
}

export interface Actor {
    id: string | number;
    fullName?: string;
    email?: string;
    phone?: string;
    accountStatus?: string;
    nationalId?: string;
    createdAt?: string;
    [key: string]: unknown;
}

export interface AuthResponse {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    actor?: Actor;
    permissions?: string[];
    [key: string]: unknown;
}

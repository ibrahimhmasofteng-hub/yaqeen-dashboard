export interface Permission {
    id?: string | number;
    name?: string;
    code?: string;
    [key: string]: unknown;
}

export interface PermissionsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface PermissionsListResponse {
    data: Permission[];
    meta: PermissionsMeta;
}

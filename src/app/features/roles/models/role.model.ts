export interface RolePermission {
    id?: string | number;
    name?: string;
    enabled?: boolean;
}

export interface Role {
    id?: string | number;
    name?: string;
    permissions?: RolePermission[];
    users?: Array<{ id: number | string; name: string }>;
    [key: string]: unknown;
}

export interface RolesMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface RolesListResponse {
    data: Role[];
    meta: RolesMeta;
}

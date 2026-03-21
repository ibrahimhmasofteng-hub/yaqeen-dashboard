export interface AuditLog {
    id?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    ip?: string;
    duration?: string;
    errorMessage?: string | null;
    actorName?: string | null;
    createdAt?: string;
    [key: string]: unknown;
}

export interface AuditLogsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface AuditLogsListResponse {
    data: AuditLog[];
    meta: AuditLogsMeta;
}

export interface Permission {
    id?: string | number;
    name?: string;
    code?: string;
    [key: string]: unknown;
}

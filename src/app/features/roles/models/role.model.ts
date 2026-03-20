import { Permission } from '@/app/features/permissions/models/permission.model';

export interface Role {
    id?: string | number;
    name?: string;
    permissions?: Permission[] | Array<number | string>;
    users?: Array<{ id: number | string; name: string }>;
    [key: string]: unknown;
}

import { Permission } from './permission.model';

export interface Role {
    id?: string | number;
    name?: string;
    permissions?: Permission[] | Array<string | number>;
    [key: string]: unknown;
}

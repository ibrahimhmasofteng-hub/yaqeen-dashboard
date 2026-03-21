import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Role, RolePermission, RolesListResponse } from '@/app/features/roles/models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number): Observable<RolesListResponse> {
        return this.api.get<RolesListResponse>('role', { params: { page, perPage } });
    }

    get(id: string | number): Observable<Role> {
        return this.api.get<Role>(`role/${id}`);
    }

    create(payload: { name: string; permissions: RolePermission[] }): Observable<Role> {
        return this.api.post<Role>('role', payload);
    }

    update(id: string | number, payload: { name?: string; permissions?: RolePermission[] }): Observable<Role> {
        return this.api.patch<Role>(`role/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`role/${id}`);
    }
}

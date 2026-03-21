import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { PermissionsListResponse } from '@/app/features/permissions/models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number): Observable<PermissionsListResponse> {
        return this.api.get<PermissionsListResponse>('permission', { params: { page, perPage } });
    }
}

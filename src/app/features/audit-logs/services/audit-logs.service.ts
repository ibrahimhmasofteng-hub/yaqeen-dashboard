import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuditLogsListResponse } from '@/app/features/audit-logs/models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: { method?: string }): Observable<AuditLogsListResponse> {
        const params: Record<string, string | number | undefined> = {
            page, perPage,
            ...(filters?.method ? { method: filters.method } : {})
        };
        return this.api.get<AuditLogsListResponse>('audit-logs', { params });
    }
}

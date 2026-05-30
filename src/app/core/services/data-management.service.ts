import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ImportResult } from '@/app/features/students/models/import-result.model';

@Injectable({ providedIn: 'root' })
export class DataManagementService {
    private api = inject(ApiService);

    importFile(role: string, file: File): Observable<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.upload<ImportResult>(`data-management/import/${role}`, formData);
    }

    downloadTemplate(role: string): Observable<Blob> {
        return this.api.downloadBlob(`data-management/templates/${role}`);
    }
}

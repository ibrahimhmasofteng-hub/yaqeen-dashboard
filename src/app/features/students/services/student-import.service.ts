import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ImportResult } from '@/app/features/students/models/import-result.model';

@Injectable({ providedIn: 'root' })
export class StudentImportService {
    private api: ApiService = inject(ApiService);

    importFile(file: File, roleId: string): Observable<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roleId', roleId);
        return this.api.upload<ImportResult>('actors/import', formData);
    }

    downloadTemplate(): Observable<Blob> {
        return this.api.downloadBlob('actors/import-template');
    }
}

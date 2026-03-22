import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { RelationType } from '@/app/features/students/models/relation-type.enum';

@Injectable({ providedIn: 'root' })
export class FamilyRelationService {
    private api: ApiService = inject(ApiService);

    create(payload: { studentId: string; familyMemberId: string; relationType: RelationType }): Observable<unknown> {
        return this.api.post<unknown>('family-relations', payload);
    }
}

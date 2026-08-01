import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { RelationType } from '@/app/features/students/models/relation-type.enum';

export interface FamilyRelationActor {
    id?: string;
    username?: string;
    email?: string;
    phone?: string;
    role?: {
        id?: string;
        name?: string;
    };
    profile?: {
        firstName?: string;
        lastName?: string;
    };
}

export interface FamilyRelation {
    id?: string;
    relationType?: RelationType | string;
    studentId?: string;
    familyMemberId?: string;
    isActive?: boolean;
    student?: FamilyRelationActor;
    familyMember?: FamilyRelationActor;
}

export interface FamilyRelationsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface FamilyRelationsResponse {
    data: FamilyRelation[];
    meta: FamilyRelationsMeta;
}

@Injectable({ providedIn: 'root' })
export class FamilyRelationService {
    private api: ApiService = inject(ApiService);

    create(payload: { studentId: string; familyMemberId: string; relationType: RelationType }): Observable<unknown> {
        return this.api.post<unknown>('family-relations', payload);
    }

    update(id: string, payload: { relationType?: RelationType; isActive?: boolean }): Observable<unknown> {
        return this.api.patch<unknown>(`family-relations/${id}`, payload);
    }

    remove(id: string): Observable<unknown> {
        return this.api.delete<unknown>(`family-relations/${id}`);
    }

    listByStudent(studentId: string, page = 1, perPage = 10): Observable<FamilyRelationsResponse> {
        return this.api.get<FamilyRelationsResponse>(`family-relations/students/${studentId}`, {
            params: { page, perPage }
        });
    }

    listGuardians(studentId: string, page = 1, perPage = 100): Observable<FamilyRelationsResponse> {
        return this.api.get<FamilyRelationsResponse>(`family-relations/guardians/${studentId}`, {
            params: { page, perPage }
        });
    }

    listAllGuardians(page = 1, perPage = 100): Observable<FamilyRelationsResponse> {
        return this.api.get<FamilyRelationsResponse>('family-relations/guardians', {
            params: { page, perPage }
        });
    }

    listStudents(guardianId: string, page = 1, perPage = 10): Observable<FamilyRelationsResponse> {
        return this.api.get<FamilyRelationsResponse>(`family-relations/students/${guardianId}`, {
            params: { page, perPage }
        });
    }
}

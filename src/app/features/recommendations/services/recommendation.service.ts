import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { RecommendationResponseDTO, JuzzTestResponseDTO } from '@/app/features/recommendations/models/recommendation.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
    private api: ApiService = inject(ApiService);

    getRecommendations(studentId: string, courseId: string): Observable<RecommendationResponseDTO> {
        return this.api.get<RecommendationResponseDTO>(`student-follow-up/${studentId}/recommendations`, {
            params: { courseId }
        });
    }

    getJuzzTest(studentId: string, courseId: string): Observable<JuzzTestResponseDTO> {
        return this.api.get<JuzzTestResponseDTO>(`student-follow-up/${studentId}/juzz-test`, {
            params: { courseId }
        });
    }

    sendRecommendation(studentId: string, courseId: string): Observable<unknown> {
        return this.api.post<unknown>(`student-follow-up/${studentId}/send-recommendation`, undefined, {
            params: { courseId }
        });
    }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Event, EventsListResponse, EventStats, EventProgress, EventParticipant } from '@/app/features/events/models/event.model';
import { EventType } from '@/app/features/events/models/event-type.enum';

export interface EventFilters {
    courseId?: string;
    name?: string;
    type?: EventType;
    isActive?: boolean;
    isCompleted?: boolean;
    startDateStartDate?: string;
    startDateEndDate?: string;
    endDateStartDate?: string;
    endDateEndDate?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: EventFilters): Observable<EventsListResponse> {
        const params: Record<string, string | number | boolean | undefined> = {
            page,
            perPage,
            ...(filters?.courseId ? { courseId: filters.courseId } : {}),
            ...(filters?.name ? { name: filters.name } : {}),
            ...(filters?.type ? { type: filters.type } : {}),
            ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
            ...(filters?.isCompleted !== undefined ? { isCompleted: filters.isCompleted } : {}),
            ...(filters?.startDateStartDate ? { startDateStartDate: filters.startDateStartDate } : {}),
            ...(filters?.startDateEndDate ? { startDateEndDate: filters.startDateEndDate } : {}),
            ...(filters?.endDateStartDate ? { endDateStartDate: filters.endDateStartDate } : {}),
            ...(filters?.endDateEndDate ? { endDateEndDate: filters.endDateEndDate } : {})
        };
        return this.api.get<EventsListResponse>('events', { params });
    }

    get(id: string | number): Observable<Event> {
        return this.api.get<Event>(`events/${id}`);
    }

    create(payload: {
        courseId: string;
        name: string;
        pointsRewardAmount: number;
        targetCriteria: number;
        type: EventType;
        startDate: string;
        endDate: string;
        description?: string;
        isActive?: boolean;
    }): Observable<Event> {
        return this.api.post<Event>('events', payload);
    }

    update(
        id: string | number,
        payload: {
            courseId?: string;
            name?: string;
            description?: string;
            pointsRewardAmount?: number;
            targetCriteria?: number;
            type?: EventType;
            isActive?: boolean;
            startDate?: string;
            endDate?: string;
        }
    ): Observable<Event> {
        return this.api.patch<Event>(`events/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`events/${id}`);
    }

    getStats(id: string | number): Observable<EventStats> {
        return this.api.get<EventStats>(`events/${id}/stats`);
    }

    getMyProgress(id: string | number): Observable<EventProgress> {
        return this.api.get<EventProgress>(`events/${id}/my-progress`);
    }

    getParticipants(id: string | number): Observable<EventParticipant[]> {
        return this.api.get<EventParticipant[]>(`events/${id}/participants`);
    }
}

import { EventType } from './event-type.enum';

export interface Event {
    id?: string | number;
    courseId?: string;
    name?: string;
    description?: string;
    pointsRewardAmount?: number;
    targetCriteria?: number;
    type?: EventType;
    isActive?: boolean;
    isCompleted?: boolean;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface EventsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface EventsListResponse {
    data: Event[];
    meta: EventsMeta;
}

export interface EventStats {
    eventType: EventType;
    total: number;
    completed: number;
    uniqueParticipants: number;
}

export interface EventProgress {
    eventType: EventType;
    total: number;
    completed: number;
    targetCriteria: number;
    isQualified: boolean;
}

export interface EventParticipant {
    studentId: string;
    studentName: string;
    imageUrl: string;
    completed: number;
    target: number;
    qualified: boolean;
    rank: number;
}



import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Note, NoteListResponse, CreateNotePayload, UpdateNotePayload } from '@/app/features/students/models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
    private api: ApiService = inject(ApiService);

    list(params?: Record<string, string | number | boolean | undefined>): Observable<NoteListResponse> {
        return this.api.get<NoteListResponse>('notes', { params });
    }

    get(id: string): Observable<Note> {
        return this.api.get<Note>(`notes/${id}`);
    }

    create(payload: CreateNotePayload): Observable<Note> {
        return this.api.post<Note>('notes', payload);
    }

    update(id: string, payload: UpdateNotePayload): Observable<Note> {
        return this.api.patch<Note>(`notes/${id}`, payload);
    }

    delete(id: string): Observable<unknown> {
        return this.api.delete<unknown>(`notes/${id}`);
    }

    getMine(params?: Record<string, string | number | boolean | undefined>): Observable<NoteListResponse> {
        return this.api.get<NoteListResponse>('notes/mine', { params });
    }

    getCreatedByMe(params?: Record<string, string | number | boolean | undefined>): Observable<NoteListResponse> {
        return this.api.get<NoteListResponse>('notes/created-by-me', { params });
    }
}

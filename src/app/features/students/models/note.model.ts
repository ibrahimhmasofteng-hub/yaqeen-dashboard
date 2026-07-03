import { Student, StudentsMeta } from './student.model';

export interface Note {
    id: string;
    note: string;
    studentId: string;
    student?: Student;
    createdByActorId: string;
    createdBy?: Student;
    createdAt: string;
    updatedAt: string;
}

export interface NoteListResponse {
    data: Note[];
    meta: StudentsMeta;
}

export interface CreateNotePayload {
    note: string;
    studentId: string;
}

export interface UpdateNotePayload {
    note?: string;
    studentId?: string;
}

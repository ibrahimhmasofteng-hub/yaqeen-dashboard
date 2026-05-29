export interface ImportResult {
    imported: number;
    skipped: number;
    errors: ImportError[];
}

export interface ImportError {
    row: number;
    message: string;
}

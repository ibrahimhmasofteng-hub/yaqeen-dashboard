export interface PostFile {
    id: string;
    fileName: string;
    url: string;
    size: number;
}

export interface PostCreatedBy {
    id: string;
    name: string;
}

export interface Post {
    id?: string | number;
    title?: string;
    description?: string;
    isPublished?: boolean;
    courseId?: string;
    createdByActorId?: string;
    createdBy?: PostCreatedBy;
    files?: PostFile[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PostsMeta {
    page: number;
    perPage: number;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
}

export interface PostsListResponse {
    data: Post[];
    meta: PostsMeta;
}

export interface MediaEntity {
    id: string;
    url: string;
    fileName: string;
    type: 'video' | 'image' | 'document' | 'pdf' | 'excel' | 'csv';
    size: number;
}

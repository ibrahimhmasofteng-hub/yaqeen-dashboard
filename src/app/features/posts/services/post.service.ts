import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Post, PostsListResponse } from '@/app/features/posts/models/post.model';

export interface PostFilters {
    courseId?: string;
    isPublished?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PostService {
    private api: ApiService = inject(ApiService);

    list(page: number, perPage: number, filters?: PostFilters): Observable<PostsListResponse> {
        const params: Record<string, string | number | boolean | undefined> = {
            page,
            perPage,
            ...(filters?.courseId ? { courseId: filters.courseId } : {}),
            ...(filters?.isPublished !== undefined ? { isPublished: filters.isPublished } : {})
        };
        return this.api.get<PostsListResponse>('posts', { params });
    }

    listPublished(page: number, perPage: number, filters?: PostFilters): Observable<PostsListResponse> {
        const params: Record<string, string | number | boolean | undefined> = {
            page,
            perPage,
            ...(filters?.courseId ? { courseId: filters.courseId } : {})
        };
        return this.api.get<PostsListResponse>('posts/published', { params });
    }

    get(id: string | number): Observable<Post> {
        return this.api.get<Post>(`posts/${id}`);
    }

    create(payload: {
        title: string;
        courseId: string;
        description?: string;
        isPublished?: boolean;
        fileIds?: string[];
    }): Observable<Post> {
        return this.api.post<Post>('posts', payload);
    }

    update(
        id: string | number,
        payload: {
            title?: string;
            description?: string;
            isPublished?: boolean;
            courseId?: string;
            fileIds?: string[];
        }
    ): Observable<Post> {
        return this.api.patch<Post>(`posts/${id}`, payload);
    }

    delete(id: string | number): Observable<unknown> {
        return this.api.delete<unknown>(`posts/${id}`);
    }
}

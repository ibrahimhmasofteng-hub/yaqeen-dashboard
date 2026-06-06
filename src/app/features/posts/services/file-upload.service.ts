import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { MediaEntity } from '@/app/features/posts/models/post.model';

@Injectable({ providedIn: 'root' })
export class FileUploadService {
    private api: ApiService = inject(ApiService);

    upload(file: File): Observable<MediaEntity> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.upload<MediaEntity>('files/upload', formData);
    }
}

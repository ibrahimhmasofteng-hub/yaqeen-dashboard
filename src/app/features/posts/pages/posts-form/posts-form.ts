import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';
import { PostService } from '@/app/features/posts/services/post.service';
import { FileUploadService } from '@/app/features/posts/services/file-upload.service';
import { Post as PostModel, MediaEntity } from '@/app/features/posts/models/post.model';
import { CourseService } from '@/app/features/courses/services/course.service';
import { Course } from '@/app/features/courses/models/course.model';
import { NotificationService } from '@/app/core/services/notification.service';

interface AttachedFile {
    id: string;
    fileName: string;
    url?: string;
    isNew?: boolean;
}

@Component({
    selector: 'app-posts-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TextareaModule,
        ToggleSwitchModule,
        FileUploadModule,
        TranslateModule,
        FormErrors
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ isEditMode ? ('pages.posts.edit_title' | translate) : ('pages.posts.create_title' | translate) }}</h2>
                <p class="text-surface-500">{{ isEditMode ? ('pages.posts.edit_subtitle' | translate) : ('pages.posts.create_subtitle' | translate) }}</p>
            </div>
            <p-button *ngIf="viewOnly" [label]="'common.edit' | translate" icon="pi pi-pencil" severity="secondary" (onClick)="goToEdit()"></p-button>
        </div>

        <div class="card">
            <form [formGroup]="postForm">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    <div>
                        <label for="postTitle" class="block font-bold mb-3">{{ 'fields.title' | translate }} <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="postTitle" formControlName="title" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <app-form-errors [control]="postForm.get('title')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="postCourse" class="block font-bold mb-3">{{ 'fields.course' | translate }} <span class="text-red-500">*</span></label>
                        <p-select
                            id="postCourse"
                            [options]="courses()"
                            optionLabel="name"
                            optionValue="id"
                            formControlName="courseId"
                            appendTo="body"
                            [disabled]="submitting || viewOnly"
                            [placeholder]="'common.select_course' | translate"
                            [loading]="coursesLoading"
                            fluid
                        />
                        <app-form-errors [control]="postForm.get('courseId')" [show]="submitted"></app-form-errors>
                    </div>
                    <div class="flex items-center gap-3">
                        <label for="isPublished" class="block font-bold">{{ 'fields.published' | translate }}</label>
                        <p-toggleswitch id="isPublished" formControlName="isPublished" [disabled]="submitting || viewOnly" />
                    </div>
                    <div class="md:col-span-2">
                        <label for="description" class="block font-bold mb-3">{{ 'fields.description' | translate }}</label>
                        <textarea pTextarea id="description" formControlName="description" rows="5" fluid [readonly]="viewOnly" [disabled]="submitting"></textarea>
                    </div>
                </div>

                <div class="mt-6">
                    <div class="flex items-center justify-between mb-3">
                        <label class="block font-bold">{{ 'fields.attachments' | translate }}</label>
                        <p-button *ngIf="!viewOnly" [label]="'common.upload_file' | translate" icon="pi pi-upload" severity="secondary" size="small" (onClick)="fileInput.click()" [disabled]="uploading" [loading]="uploading" />
                        <input #fileInput type="file" style="display:none" multiple (change)="onFilesSelected($event)" />
                    </div>
                    <div *ngIf="attachedFiles.length" class="flex flex-col gap-2">
                        <div *ngFor="let file of attachedFiles; let i = index" class="flex items-center justify-between surface-ground p-3 border-round">
                            <div class="flex items-center gap-3">
                                <i class="pi pi-file text-primary"></i>
                                <span class="font-medium">{{ file.fileName }}</span>
                            </div>
                            <p-button *ngIf="!viewOnly" icon="pi pi-times" severity="danger" [rounded]="true" [text]="true" size="small" (onClick)="removeFile(i)" [disabled]="submitting" />
                        </div>
                    </div>
                    <p *ngIf="!attachedFiles.length" class="text-surface-500 text-sm">{{ 'common.no_files' | translate }}</p>
                </div>

                <div class="flex justify-end gap-2 mt-6" *ngIf="!viewOnly">
                    <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="goBack()" [disabled]="submitting" />
                    <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="savePost()" [loading]="submitting" [disabled]="submitting"></p-button>
                </div>
            </form>
        </div>
    `
})
export class PostsForm implements OnInit {
    postForm: FormGroup;

    viewOnly = false;
    isEditMode = false;
    submitted = false;
    submitting = false;
    uploading = false;

    currentPostId?: string;
    private originalPost?: PostModel;

    courses = signal<Course[]>([]);
    coursesLoading = false;

    attachedFiles: AttachedFile[] = [];

    constructor(
        private postService: PostService,
        private fileUploadService: FileUploadService,
        private courseService: CourseService,
        private notification: NotificationService,
        private translate: TranslateService,
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.postForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
            courseId: [null, Validators.required],
            description: [''],
            isPublished: [false]
        });
    }

    ngOnInit() {
        this.loadCourses();

        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.currentPostId = id;
                this.loadPost(id);
            }
        });

        this.route.queryParamMap.subscribe((params) => {
            this.viewOnly = params.get('view') === '1';
        });
    }

    loadCourses() {
        this.coursesLoading = true;
        this.courseService.list(1, 100).subscribe({
            next: (res) => {
                this.courses.set(res?.data ?? []);
                this.coursesLoading = false;
            },
            error: () => { this.coursesLoading = false; }
        });
    }

    loadPost(id: string) {
        this.postService.get(id).subscribe({
            next: (post) => {
                this.originalPost = post;
                this.postForm.patchValue({
                    title: post.title ?? '',
                    courseId: post.courseId ?? null,
                    description: post.description ?? '',
                    isPublished: post.isPublished ?? false
                });
                this.attachedFiles = (post.files ?? []).map((f) => ({
                    id: f.id,
                    fileName: f.fileName,
                    url: f.url,
                    isNew: false
                }));
            }
        });
    }

    goToEdit() {
        if (!this.currentPostId) return;
        this.router.navigate(['/posts', this.currentPostId, 'edit']);
    }

    goBack() {
        this.router.navigate(['/posts']);
    }

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        this.uploading = true;
        const files = Array.from(input.files!);
        let remaining = files.length;

        files.forEach((file) => {
            this.fileUploadService.upload(file).subscribe({
                next: (media) => {
                    this.attachedFiles.push({ id: media.id, fileName: media.fileName, url: media.url, isNew: true });
                    remaining -= 1;
                    if (remaining === 0) this.uploading = false;
                },
                error: () => {
                    remaining -= 1;
                    if (remaining === 0) this.uploading = false;
                }
            });
        });

        input.value = '';
    }

    removeFile(index: number) {
        this.attachedFiles.splice(index, 1);
    }

    savePost() {
        if (this.viewOnly) return;
        this.submitted = true;
        this.postForm.markAllAsTouched();
        if (this.postForm.invalid) return;

        const formValue = this.postForm.getRawValue();
        const fileIds = this.attachedFiles.map((f) => f.id);
        this.submitting = true;
        this.postForm.disable();

        if (this.isEditMode && this.currentPostId) {
            const payload = this.buildUpdatePayload(formValue, fileIds);
            this.postService.update(this.currentPostId, payload).subscribe({
                next: () => {
                    this.submitting = false;
                    this.postForm.enable();
                    this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.post') }));
                },
                error: () => {
                    this.submitting = false;
                    this.postForm.enable();
                }
            });
            return;
        }

        this.postService.create({ ...formValue, fileIds }).subscribe({
            next: () => {
                this.submitting = false;
                this.postForm.enable();
                this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.post') }));
                this.router.navigate(['/posts']);
            },
            error: () => {
                this.submitting = false;
                this.postForm.enable();
            }
        });
    }

    private buildUpdatePayload(formValue: Record<string, unknown>, fileIds: string[]): Record<string, unknown> {
        const orig = this.originalPost;
        if (!orig) return { ...formValue, fileIds };

        const origFileIds = (orig.files ?? []).map((f) => f.id);
        const changed: Record<string, unknown> = {};

        if (formValue['title'] !== orig.title) changed['title'] = formValue['title'];
        if (formValue['courseId'] !== orig.courseId) changed['courseId'] = formValue['courseId'];
        if (formValue['description'] !== orig.description) changed['description'] = formValue['description'];
        if (formValue['isPublished'] !== orig.isPublished) changed['isPublished'] = formValue['isPublished'];

        const sortedNew = [...fileIds].sort();
        const sortedOrig = [...origFileIds].sort();
        if (JSON.stringify(sortedNew) !== JSON.stringify(sortedOrig)) {
            changed['fileIds'] = fileIds;
        }

        return changed;
    }
}

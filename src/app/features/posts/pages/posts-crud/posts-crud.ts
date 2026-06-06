import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PostService, PostFilters } from '@/app/features/posts/services/post.service';
import { Post as PostModel, PostsMeta } from '@/app/features/posts/models/post.model';
import { CourseService } from '@/app/features/courses/services/course.service';
import { Course } from '@/app/features/courses/models/course.model';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-posts-crud',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        SelectModule,
        TranslateModule,
        TooltipModule,
        TagModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelectedPosts()" [disabled]="!selectedPosts || !selectedPosts.length" />
            </ng-template>
            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="posts()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [tableStyle]="{ 'min-width': '70rem' }"
            [(selection)]="selectedPosts"
            [rowHover]="true"
            dataKey="id"
            [currentPageReportTemplate]="'common.page_report' | translate"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            [totalRecords]="meta().total"
            [lazy]="true"
            (onPage)="onPage($event)"
        >
            <ng-template #caption>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h5 class="m-0">{{ 'pages.posts.manage_title' | translate }}</h5>
                    <div class="flex flex-wrap gap-2 items-center">
                        <p-select [options]="courseOptions" [(ngModel)]="filterCourseId" optionLabel="name" optionValue="id" [showClear]="true" [placeholder]="'fields.course' | translate" (onChange)="onFilterCourse($event.value ?? '')" appendTo="body" [loading]="coursesLoading" />
                        <p-select [options]="publishedOptions" [(ngModel)]="filterPublished" optionLabel="label" optionValue="value" [showClear]="true" [placeholder]="'fields.published' | translate" (onChange)="onFilterPublished($event.value ?? '')" appendTo="body" />
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onSearch($event)" [placeholder]="'common.search' | translate" />
                        </p-iconfield>
                    </div>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="title" style="min-width: 18rem">
                        {{ 'fields.title' | translate }}
                        <p-sortIcon field="title" />
                    </th>
                    <th style="min-width: 14rem">{{ 'fields.course' | translate }}</th>
                    <th style="min-width: 14rem">{{ 'fields.author' | translate }}</th>
                    <th style="min-width: 10rem">{{ 'fields.published' | translate }}</th>
                    <th style="min-width: 10rem">{{ 'fields.files' | translate }}</th>
                    <th pSortableColumn="createdAt" style="min-width: 12rem">
                        {{ 'fields.created_at' | translate }}
                        <p-sortIcon field="createdAt" />
                    </th>
                    <th style="min-width: 10rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-post>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="post" /></td>
                    <td style="min-width: 18rem">{{ displayValue(post.title) }}</td>
                    <td style="min-width: 14rem">{{ displayValue(post.courseId) }}</td>
                    <td style="min-width: 14rem">{{ post.createdBy?.name ?? '-' }}</td>
                    <td style="min-width: 10rem">
                        <p-tag [value]="post.isPublished ? ('common.published' | translate) : ('common.draft' | translate)" [severity]="post.isPublished ? 'success' : 'warn'" />
                    </td>
                    <td style="min-width: 10rem">{{ post.files?.length ?? 0 }}</td>
                    <td style="min-width: 12rem">{{ post.createdAt ? (post.createdAt | date:'mediumDate') : '-' }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editPost(post)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deletePost(post)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class PostsCrud implements OnInit {
    posts = signal<PostModel[]>([]);
    meta = signal<PostsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading = false;

    filterCourseId = '';
    filterPublished = '';
    searchTerm = '';
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    courseOptions: Course[] = [];
    coursesLoading = false;

    publishedOptions = [
        { label: 'Published', value: 'true' },
        { label: 'Draft', value: 'false' }
    ];

    selectedPosts!: PostModel[] | null;

    @ViewChild('dt') dt!: Table;
    cols!: Column[];

    constructor(
        private postService: PostService,
        private courseService: CourseService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadPosts(1, 10);
        this.loadCourses();
        this.setColumns();
        this.translate.onLangChange.subscribe(() => this.setColumns());
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    loadCourses() {
        this.coursesLoading = true;
        this.courseService.list(1, 100).subscribe({
            next: (res) => {
                this.courseOptions = res?.data ?? [];
                this.coursesLoading = false;
            },
            error: () => { this.coursesLoading = false; }
        });
    }

    loadPosts(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        const filters: PostFilters = {
            ...(this.filterCourseId ? { courseId: this.filterCourseId } : {}),
            ...(this.filterPublished !== '' ? { isPublished: this.filterPublished === 'true' } : {})
        };
        this.postService.list(page, perPage, filters).subscribe({
            next: (res) => {
                this.posts.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement)?.value ?? '';
        this.searchTerm = value;
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadPosts(1, this.meta().perPage), 400);
    }

    onFilterCourse(value: string) {
        this.filterCourseId = value;
        this.loadPosts(1, this.meta().perPage);
    }

    onFilterPublished(value: string) {
        this.filterPublished = value;
        this.loadPosts(1, this.meta().perPage);
    }

    openNew() {
        this.router.navigate(['/posts/new']);
    }

    editPost(post: PostModel) {
        this.router.navigate(['/posts', post.id, 'edit']);
    }

    deleteSelectedPosts() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', { entity: this.translate.instant('entities.posts') }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedPosts ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((post) => {
                    this.postService.delete(post.id as string).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: this.translate.instant('common.successful'),
                                    detail: this.translate.instant('common.deleted_many', { entity: this.translate.instant('entities.posts') }),
                                    life: 3000
                                });
                                this.selectedPosts = null;
                                this.loadPosts(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    deletePost(post: PostModel) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: post.title }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.postService.delete(post.id as string).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.post') }),
                            life: 3000
                        });
                        this.loadPosts(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        this.loadPosts(Math.floor(event.first / event.rows) + 1, event.rows);
    }

    private setColumns() {
        this.cols = [
            { field: 'title', header: this.translate.instant('fields.title') },
            { field: 'courseId', header: this.translate.instant('fields.course') },
            { field: 'createdBy', header: this.translate.instant('fields.author') },
            { field: 'isPublished', header: this.translate.instant('fields.published') },
            { field: 'createdAt', header: this.translate.instant('fields.created_at') }
        ];
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }
}

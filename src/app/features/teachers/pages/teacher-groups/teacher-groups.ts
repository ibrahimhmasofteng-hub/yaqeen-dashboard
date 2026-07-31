import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TeacherService } from '@/app/features/teachers/services/teacher.service';
import { CourseGroupsService } from '@/app/features/courses/services/course-groups.service';
import { Teacher, TeacherGroupAssignment } from '@/app/features/teachers/models/teacher.model';

@Component({
    selector: 'app-teacher-groups',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        TagModule,
        TooltipModule,
        TranslateModule
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ 'pages.teachers.groups_title' | translate }}</h2>
                <p class="text-surface-500">{{ teacher()?.username ?? '' }}</p>
            </div>
            <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" text (onClick)="goBack()"></p-button>
        </div>

        <div *ngIf="loading" class="flex justify-center items-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
        </div>

        <ng-container *ngIf="!loading">
            <div class="card mb-6">
                <h3 class="text-lg font-semibold mb-4">{{ 'pages.teachers.teacher_info' | translate }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.username' | translate }}</div>
                        <div class="font-semibold">{{ teacher()?.username ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.email' | translate }}</div>
                        <div class="font-semibold">{{ teacher()?.email ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.phone' | translate }}</div>
                        <div class="font-semibold">{{ teacher()?.phone ?? '-' }}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3 class="text-lg font-semibold mb-4">{{ 'pages.teachers.assigned_groups' | translate }}</h3>

                <div *ngIf="groupsLoading" class="flex justify-center py-6">
                    <i class="pi pi-spin pi-spinner text-xl"></i>
                </div>

                <div *ngIf="!groupsLoading && groups().length === 0" class="text-surface-500 text-center py-4">
                    {{ 'common.no_data' | translate }}
                </div>

                <p-table
                    *ngIf="!groupsLoading && groups().length > 0"
                    [value]="groups()"
                    [tableStyle]="{ 'min-width': '50rem' }"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="meta().total"
                    [lazy]="true"
                    (onPage)="onPage($event)"
                >
                    <ng-template #header>
                        <tr>
                            <th>{{ 'fields.type' | translate }}</th>
                            <th>{{ 'fields.assigned_at' | translate }}</th>
                            <th style="width: 5rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-group>
                        <tr>
                            <td>
                                <p-tag
                                    [value]="'enums.teacher_type.' + group.type | translate"
                                    [severity]="group.type === 'MAIN' ? 'success' : 'secondary'"
                                />
                            </td>
                            <td>{{ group.assignedAt | date: 'medium' }}</td>
                            <td>
                                <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" (click)="viewGroup(group)" pTooltip="{{ 'common.details' | translate }}" tooltipPosition="top" />
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </ng-container>
    `
})
export class TeacherGroups implements OnInit {
    teacher = signal<Teacher | null>(null);
    groups = signal<TeacherGroupAssignment[]>([]);
    meta = signal<{ page: number; perPage: number; total: number }>({ page: 1, perPage: 10, total: 0 });

    loading = false;
    groupsLoading = false;

    private teacherId?: string;

    constructor(
        private teacherService: TeacherService,
        private courseGroupsService: CourseGroupsService,
        private translate: TranslateService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.teacherId = id;
                this.loadTeacher(id);
                this.loadGroups(id);
            }
        });
    }

    loadTeacher(id: string) {
        this.loading = true;
        this.teacherService.get(id).subscribe({
            next: (data) => {
                this.teacher.set(data);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadGroups(id: string, page: number = 1, perPage: number = 10) {
        this.groupsLoading = true;
        this.teacherService.getGroups(id, page, perPage).subscribe({
            next: (res) => {
                this.groups.set(res?.data ?? []);
                this.meta.set({
                    page: res?.meta?.page ?? page,
                    perPage: res?.meta?.perPage ?? perPage,
                    total: res?.meta?.total ?? 0
                });
                this.groupsLoading = false;
            },
            error: () => {
                this.groupsLoading = false;
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        if (this.teacherId) {
            this.loadGroups(this.teacherId, page, perPage);
        }
    }

    goBack() {
        this.router.navigate(['/teachers']);
    }

    viewGroup(group: TeacherGroupAssignment) {
        this.courseGroupsService.get(group.groupId).subscribe({
            next: (g) => {
                this.router.navigate(['/courses', g.courseId, 'edit']);
            }
        });
    }
}

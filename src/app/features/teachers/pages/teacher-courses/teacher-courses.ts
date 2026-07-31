import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TeacherService } from '@/app/features/teachers/services/teacher.service';
import { Teacher, TeacherCourseSummary } from '@/app/features/teachers/models/teacher.model';

@Component({
    selector: 'app-teacher-courses',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        CardModule,
        TranslateModule
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ 'pages.teachers.courses_title' | translate }}</h2>
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

            <div class="card mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">{{ 'pages.teachers.supervised_courses' | translate }}</h3>
                    <div class="text-surface-500 text-sm">
                        {{ 'fields.total' | translate }}: {{ courses().length }}
                    </div>
                </div>

                <div *ngIf="coursesLoading" class="flex justify-center py-6">
                    <i class="pi pi-spin pi-spinner text-xl"></i>
                </div>

                <div *ngIf="!coursesLoading && courses().length === 0" class="text-surface-500 text-center py-4">
                    {{ 'common.no_data' | translate }}
                </div>

                <p-table *ngIf="!coursesLoading && courses().length > 0" [value]="courses()" [tableStyle]="{ 'min-width': '60rem' }">
                    <ng-template #header>
                        <tr>
                            <th>{{ 'fields.course_name' | translate }}</th>
                            <th>{{ 'fields.groups' | translate }}</th>
                            <th>{{ 'fields.students' | translate }}</th>
                            <th>{{ 'fields.recitations_assessed' | translate }}</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-course>
                        <tr>
                            <td class="font-semibold">{{ course.courseName }}</td>
                            <td>{{ course.groupCount }}</td>
                            <td>{{ course.studentsAssigned }}</td>
                            <td>{{ course.recitationsAssessed }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <div class="card">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">{{ 'pages.teachers.total_recitations' | translate }}</h3>
                    <span class="text-2xl font-bold text-primary">{{ totalRecitations() }}</span>
                </div>
            </div>
        </ng-container>
    `
})
export class TeacherCourses implements OnInit {
    teacher = signal<Teacher | null>(null);
    courses = signal<TeacherCourseSummary[]>([]);
    totalRecitations = signal<number>(0);

    loading = false;
    coursesLoading = false;

    private teacherId?: string;

    constructor(
        private teacherService: TeacherService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.teacherId = id;
                this.loadTeacher(id);
                this.loadCourses(id);
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

    loadCourses(id: string) {
        this.coursesLoading = true;
        this.teacherService.getOverview(id).subscribe({
            next: (res) => {
                this.courses.set(res?.courses ?? []);
                this.totalRecitations.set(res?.totalRecitationsAssessed ?? 0);
                this.coursesLoading = false;
            },
            error: () => {
                this.coursesLoading = false;
            }
        });
    }

    goBack() {
        this.router.navigate(['/teachers']);
    }
}

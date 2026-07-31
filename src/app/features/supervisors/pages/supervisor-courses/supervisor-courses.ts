import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SupervisorService } from '@/app/features/supervisors/services/supervisor.service';
import { SupervisedCourseSummary, Supervisor } from '@/app/features/supervisors/models/supervisor.model';

@Component({
    selector: 'app-supervisor-courses',
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
                <h2 class="text-2xl font-semibold">{{ 'pages.supervisors.courses_title' | translate }}</h2>
                <p class="text-surface-500">{{ supervisor()?.username ?? '' }}</p>
            </div>
            <p-button [label]="'common.cancel' | translate" icon="pi pi-arrow-left" text (onClick)="goBack()"></p-button>
        </div>

        <div *ngIf="loading" class="flex justify-center items-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
        </div>

        <ng-container *ngIf="!loading">
            <div class="card mb-6">
                <h3 class="text-lg font-semibold mb-4">{{ 'pages.supervisors.supervisor_info' | translate }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.username' | translate }}</div>
                        <div class="font-semibold">{{ supervisor()?.username ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.email' | translate }}</div>
                        <div class="font-semibold">{{ supervisor()?.email ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.phone' | translate }}</div>
                        <div class="font-semibold">{{ supervisor()?.phone ?? '-' }}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3 class="text-lg font-semibold mb-4">{{ 'pages.supervisors.supervised_courses' | translate }}</h3>

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
                            <th>{{ 'fields.students' | translate }}</th>
                            <th>{{ 'fields.groups' | translate }}</th>
                            <th>{{ 'fields.attendance_rate' | translate }}</th>
                            <th>{{ 'common.status' | translate }}</th>
                            <th style="width: 5rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-course>
                        <tr>
                            <td class="font-semibold">{{ course.courseName }}</td>
                            <td>{{ course.studentCount }}</td>
                            <td>{{ course.groupCount }}</td>
                            <td>{{ course.attendanceRate }}%</td>
                            <td>
                                <p-tag [value]="course.isActive ? ('common.active' | translate) : ('common.inactive' | translate)" [severity]="course.isActive ? 'success' : 'danger'" />
                            </td>
                            <td>
                                <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" (click)="viewCourse(course)" pTooltip="{{ 'common.details' | translate }}" tooltipPosition="top" />
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </ng-container>
    `
})
export class SupervisorCourses implements OnInit {
    supervisor = signal<Supervisor | null>(null);
    courses = signal<SupervisedCourseSummary[]>([]);

    loading = false;
    coursesLoading = false;

    private supervisorId?: string;

    constructor(
        private supervisorService: SupervisorService,
        private translate: TranslateService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.supervisorId = id;
                this.loadSupervisor(id);
                this.loadCourses(id);
            }
        });
    }

    loadSupervisor(id: string) {
        this.loading = true;
        this.supervisorService.get(id).subscribe({
            next: (data) => {
                this.supervisor.set(data);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadCourses(id: string) {
        this.coursesLoading = true;
        this.supervisorService.getCourses(id).subscribe({
            next: (res) => {
                this.courses.set(res?.courses ?? []);
                this.coursesLoading = false;
            },
            error: () => {
                this.coursesLoading = false;
            }
        });
    }

    goBack() {
        this.router.navigate(['/supervisors']);
    }

    viewCourse(course: SupervisedCourseSummary) {
        this.router.navigate(['/courses', course.courseId, 'edit']);
    }
}

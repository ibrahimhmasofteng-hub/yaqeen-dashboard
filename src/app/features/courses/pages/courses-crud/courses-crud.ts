import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseService } from '@/app/features/courses/services/course.service';
import { Course, CoursesMeta } from '@/app/features/courses/models/course.model';
import { CourseType } from '@/app/features/courses/models/course-type.enum';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-courses-crud',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        TranslateModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelectedCourses()" [disabled]="!selectedCourses || !selectedCourses.length" />
            </ng-template>

            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="courses()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'type', 'startDate', 'endDate']"
            [tableStyle]="{ 'min-width': '80rem' }"
            [(selection)]="selectedCourses"
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
                <div class="flex items-center justify-between">
                    <h5 class="m-0">{{ 'pages.courses.manage_title' | translate }}</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" [placeholder]="'common.search' | translate" />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                    <th pSortableColumn="name" style="min-width: 18rem">
                        {{ 'fields.course_name' | translate }}
                        <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="type" style="min-width: 12rem">
                        {{ 'fields.course_type' | translate }}
                        <p-sortIcon field="type" />
                    </th>
                    <th pSortableColumn="startDate" style="min-width: 14rem">
                        {{ 'fields.start_date' | translate }}
                        <p-sortIcon field="startDate" />
                    </th>
                    <th pSortableColumn="endDate" style="min-width: 14rem">
                        {{ 'fields.end_date' | translate }}
                        <p-sortIcon field="endDate" />
                    </th>
                    <th pSortableColumn="isActive" style="min-width: 10rem">
                        {{ 'common.status' | translate }}
                        <p-sortIcon field="isActive" />
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-course>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="course" />
                    </td>
                    <td style="min-width: 18rem">{{ displayValue(course.name) }}</td>
                    <td style="min-width: 12rem">{{ courseTypeLabel(course.type) }}</td>
                    <td style="min-width: 14rem">{{ course.startDate ? (course.startDate | date: 'medium') : '-' }}</td>
                    <td style="min-width: 14rem">{{ course.endDate ? (course.endDate | date: 'medium') : '-' }}</td>
                    <td style="min-width: 10rem">{{ courseActiveLabel(course.isActive) }}</td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewCourse(course)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editCourse(course)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteCourse(course)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class CoursesCrud implements OnInit {
    courses = signal<Course[]>([]);
    meta = signal<CoursesMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;

    selectedCourses!: Course[] | null;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private courseService: CourseService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadCourses(1, 10);
        this.setColumns();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    loadCourses(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.courseService.list(page, perPage).subscribe({
            next: (res) => {
                this.courses.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/courses/new']);
    }

    editCourse(course: Course) {
        this.router.navigate(['/courses', course.id, 'edit']);
    }

    viewCourse(course: Course) {
        this.router.navigate(['/courses', course.id, 'edit'], { queryParams: { view: '1' } });
    }

    deleteSelectedCourses() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', {
                entity: this.translate.instant('entities.courses')
            }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedCourses ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((course) => {
                    this.courseService.delete(course.id as string).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: this.translate.instant('common.successful'),
                                    detail: this.translate.instant('common.deleted_many', {
                                        entity: this.translate.instant('entities.courses')
                                    }),
                                    life: 3000
                                });
                                this.selectedCourses = null;
                                this.loadCourses(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    deleteCourse(course: Course) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: course.name }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.courseService.delete(course.id as string).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.course') }),
                            life: 3000
                        });
                        this.loadCourses(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadCourses(page, perPage);
    }

    private setColumns() {
        this.cols = [
            { field: 'name', header: this.translate.instant('fields.course_name') },
            { field: 'type', header: this.translate.instant('fields.course_type') },
            { field: 'startDate', header: this.translate.instant('fields.start_date') },
            { field: 'endDate', header: this.translate.instant('fields.end_date') },
            { field: 'isActive', header: this.translate.instant('common.status') }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    courseTypeLabel(value?: CourseType) {
        if (!value) return '-';
        return this.translate.instant(`enums.course_type.${value}`);
    }

    courseActiveLabel(value?: boolean) {
        if (value === undefined || value === null) return '-';
        return value ? this.translate.instant('common.active') : this.translate.instant('common.inactive');
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }
}

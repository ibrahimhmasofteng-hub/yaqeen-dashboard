import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseService } from '@/app/features/courses/services/course.service';
import { Course, CoursesMeta } from '@/app/features/courses/models/course.model';
import { CourseType } from '@/app/features/courses/models/course-type.enum';
import { WeekDay } from '@/app/features/courses/models/week-day.enum';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';

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
        ReactiveFormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        FormErrors,
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

        <p-dialog [(visible)]="courseDialog" [style]="{ width: '780px' }" [header]="'pages.courses.details_title' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="courseForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        <div>
                            <label for="name" class="block font-bold mb-3">{{ 'fields.course_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="name" formControlName="courseName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="courseForm.get('courseName')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="type" class="block font-bold mb-3">{{ 'fields.course_type' | translate }} <span class="text-red-500">*</span></label>
                            <p-select
                                id="type"
                                [options]="courseTypeOptions"
                                optionLabel="label"
                                optionValue="value"
                                formControlName="type"
                                appendTo="body"
                                [disabled]="submitting || viewOnly"
                                [placeholder]="'common.select_type' | translate"
                                fluid
                            />
                            <app-form-errors [control]="courseForm.get('type')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="startDate" class="block font-bold mb-3">{{ 'fields.start_date' | translate }} <span class="text-red-500">*</span></label>
                            <input type="datetime-local" pInputText id="startDate" formControlName="startDate" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="courseForm.get('startDate')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="endDate" class="block font-bold mb-3">{{ 'fields.end_date' | translate }} <span class="text-red-500">*</span></label>
                            <input type="datetime-local" pInputText id="endDate" formControlName="endDate" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="courseForm.get('endDate')" [show]="submitted"></app-form-errors>
                        </div>
                        <div class="md:col-span-2">
                            <label for="note" class="block font-bold mb-3">{{ 'fields.note' | translate }}</label>
                            <textarea id="note" pInputText rows="3" formControlName="note" fluid [readonly]="viewOnly" [disabled]="submitting"></textarea>
                        </div>
                    </div>

                    <div class="mt-6">
                        <div class="flex items-center justify-between mb-3">
                            <h6 class="m-0">{{ 'fields.times' | translate }}</h6>
                            <p-button type="button" [label]="'common.add_time' | translate" icon="pi pi-plus" severity="secondary" text (onClick)="addTime()" [disabled]="submitting || viewOnly"></p-button>
                        </div>

                        <div formArrayName="times" class="grid grid-cols-1 gap-4">
                            <div *ngFor="let timeGroup of times.controls; let i = index" [formGroupName]="i" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label class="block font-bold mb-3">{{ 'fields.day' | translate }} <span class="text-red-500">*</span></label>
                                    <p-select
                                        [options]="weekDayOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        formControlName="day"
                                        appendTo="body"
                                        [disabled]="submitting || viewOnly"
                                        [placeholder]="'common.select_day' | translate"
                                        fluid
                                    />
                                    <app-form-errors [control]="timeGroup.get('day')" [show]="submitted"></app-form-errors>
                                </div>
                                <div>
                                    <label class="block font-bold mb-3">{{ 'fields.start_hour' | translate }} <span class="text-red-500">*</span></label>
                                    <input type="number" step="0.25" min="0" max="23.99" pInputText formControlName="startHour" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                    <app-form-errors [control]="timeGroup.get('startHour')" [show]="submitted"></app-form-errors>
                                </div>
                                <div>
                                    <label class="block font-bold mb-3">{{ 'fields.end_hour' | translate }} <span class="text-red-500">*</span></label>
                                    <input type="number" step="0.25" min="0" max="23.99" pInputText formControlName="endHour" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                    <app-form-errors [control]="timeGroup.get('endHour')" [show]="submitted"></app-form-errors>
                                </div>
                                <div class="flex md:justify-end">
                                    <p-button type="button" icon="pi pi-trash" severity="danger" text (onClick)="removeTime(i)" [disabled]="submitting || viewOnly"></p-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="hideDialog()" [disabled]="submitting" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="saveCourse()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class CoursesCrud implements OnInit {
    courseDialog: boolean = false;
    viewOnly: boolean = false;

    courses = signal<Course[]>([]);
    meta = signal<CoursesMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;

    courseForm: FormGroup;
    currentCourseId?: string;

    selectedCourses!: Course[] | null;

    submitted: boolean = false;
    submitting: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];
    courseTypeOptions: { label: string; value: CourseType }[] = [];
    weekDayOptions: { label: string; value: WeekDay }[] = [];

    constructor(
        private courseService: CourseService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.courseForm = this.fb.group({
            courseName: ['', Validators.required],
            type: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            note: [''],
            times: this.fb.array([])
        });
    }

    get times(): FormArray {
        return this.courseForm.get('times') as FormArray;
    }

    ngOnInit() {
        this.loadCourses(1, 10);
        this.setColumns();
        this.setCourseTypeOptions();
        this.setWeekDayOptions();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
            this.setCourseTypeOptions();
            this.setWeekDayOptions();
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
        this.viewOnly = false;
        this.currentCourseId = undefined;
        this.submitted = false;
        const nowLocal = this.toDatetimeLocal(new Date().toISOString());
        this.courseForm.reset({
            courseName: '',
            type: '',
            startDate: nowLocal,
            endDate: '',
            note: ''
        });
        this.times.clear();
        this.addTime();
        this.courseForm.enable();
        this.courseDialog = true;
    }

    editCourse(course: Course) {
        this.viewOnly = false;
        this.courseDialog = true;
        this.courseService.get(course.id as string).subscribe((data) => {
            this.currentCourseId = data.id as string;
            this.courseForm.reset({
                courseName: data.name ?? '',
                type: data.type ?? '',
                startDate: this.toDatetimeLocal(data.startDate),
                endDate: this.toDatetimeLocal(data.endDate),
                note: data.note ?? ''
            });
            this.times.clear();
            (data.times ?? []).forEach((time) => this.times.push(this.createTimeGroup(time.day, time.startHour, time.endHour)));
            this.courseForm.enable();
        });
    }

    viewCourse(course: Course) {
        this.viewOnly = true;
        this.courseDialog = true;
        this.courseService.get(course.id as string).subscribe((data) => {
            this.currentCourseId = data.id as string;
            this.courseForm.reset({
                courseName: data.name ?? '',
                type: data.type ?? '',
                startDate: this.toDatetimeLocal(data.startDate),
                endDate: this.toDatetimeLocal(data.endDate),
                note: data.note ?? ''
            });
            this.times.clear();
            (data.times ?? []).forEach((time) => this.times.push(this.createTimeGroup(time.day, time.startHour, time.endHour)));
            this.courseForm.disable();
        });
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

    hideDialog() {
        this.courseDialog = false;
        this.submitted = false;
        this.viewOnly = false;
        this.courseForm.enable();
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

    saveCourse() {
        this.submitted = true;
        if (this.submitting) return;
        if (this.courseForm.invalid) return;

        const formValue = this.courseForm.getRawValue();
        const times = (formValue.times ?? [])
            .filter((time: { day?: WeekDay; startHour?: number; endHour?: number }) => time.day && time.startHour != null && time.endHour != null)
            .map((time: { day: WeekDay; startHour: number; endHour: number }) => ({
                day: time.day,
                startHour: Number(time.startHour),
                endHour: Number(time.endHour)
            }));

        const payload = {
            name: formValue.courseName,
            type: formValue.type,
            startDate: this.toIsoString(formValue.startDate),
            endDate: this.toIsoString(formValue.endDate),
            note: formValue.note,
            times: times.length ? times : undefined
        };

        this.submitting = true;
        if (!this.viewOnly) {
            this.courseForm.disable();
        }

        if (this.currentCourseId) {
            const updatePayload = this.stripEmpty(payload) as Partial<typeof payload>;
            this.courseService.update(this.currentCourseId, updatePayload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: this.translate.instant('common.successful'),
                        detail: this.translate.instant('common.updated', { entity: this.translate.instant('entities.course') }),
                        life: 3000
                    });
                    this.courseDialog = false;
                    this.loadCourses(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                    this.courseForm.enable();
                },
                error: () => {
                    this.submitting = false;
                    this.courseForm.enable();
                }
            });
            return;
        }

        this.courseService.create(payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translate.instant('common.successful'),
                    detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.course') }),
                    life: 3000
                });
                this.courseDialog = false;
                this.loadCourses(this.meta().page, this.meta().perPage);
                this.submitting = false;
                this.courseForm.enable();
            },
            error: () => {
                this.submitting = false;
                this.courseForm.enable();
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadCourses(page, perPage);
    }

    addTime() {
        this.times.push(this.createTimeGroup());
    }

    removeTime(index: number) {
        this.times.removeAt(index);
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

    private setCourseTypeOptions() {
        this.courseTypeOptions = Object.values(CourseType).map((value) => ({
            label: this.translate.instant(`enums.course_type.${value}`),
            value
        }));
    }

    private setWeekDayOptions() {
        this.weekDayOptions = Object.values(WeekDay).map((value) => ({
            label: this.translate.instant(`enums.week_day.${value}`),
            value
        }));
    }

    private createTimeGroup(day: WeekDay | '' = '', startHour: number | '' = '', endHour: number | '' = '') {
        return this.fb.group({
            day: [day, Validators.required],
            startHour: [startHour, Validators.required],
            endHour: [endHour, Validators.required]
        });
    }

    private stripEmpty<T extends Record<string, any>>(value: T): Partial<T> {
        return Object.fromEntries(
            Object.entries(value).filter(([, val]) => val !== '' && val !== null && val !== undefined)
        ) as Partial<T>;
    }

    private toDatetimeLocal(value?: string) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    private toIsoString(value?: string) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toISOString();
    }
}

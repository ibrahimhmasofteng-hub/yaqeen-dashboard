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
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PasswordModule } from 'primeng/password';
import { StepperModule } from 'primeng/stepper';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseService } from '@/app/features/courses/services/course.service';
import { CourseSupervisorsService } from '@/app/features/courses/services/course-supervisors.service';
import { Course, CoursesMeta } from '@/app/features/courses/models/course.model';
import { CourseType } from '@/app/features/courses/models/course-type.enum';
import { WeekDay } from '@/app/features/courses/models/week-day.enum';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';
import { SupervisorService } from '@/app/features/supervisors/services/supervisor.service';
import { Supervisor } from '@/app/features/supervisors/models/supervisor.model';
import { RoleService } from '@/app/features/roles/services/role.service';
import { Role } from '@/app/features/roles/models/role.model';
import { RoleName } from '@/app/core/constants/role-name.enum';

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
        MultiSelectModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        PasswordModule,
        StepperModule,
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
                    <p-stepper [value]="activeStep">
                        <p-step-list>
                            <p-step [value]="1">{{ 'wizard.account' | translate }}</p-step>
                            <p-step [value]="2">{{ 'fields.times' | translate }}</p-step>
                            <p-step [value]="3" [disabled]="!courseCreatedId">{{ 'entities.supervisors' | translate }}</p-step>
                        </p-step-list>
                        <p-step-panels>
                            <p-step-panel [value]="1">
                                <ng-template #content>
                                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label for="name" class="block font-bold mb-3">{{ 'fields.course_name' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="name" formControlName="courseName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="courseForm.get('courseName')" [show]="step1Submitted"></app-form-errors>
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
                                            <app-form-errors [control]="courseForm.get('type')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="startDate" class="block font-bold mb-3">{{ 'fields.start_date' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="datetime-local" pInputText id="startDate" formControlName="startDate" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="courseForm.get('startDate')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="endDate" class="block font-bold mb-3">{{ 'fields.end_date' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="datetime-local" pInputText id="endDate" formControlName="endDate" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="courseForm.get('endDate')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div class="md:col-span-2">
                                            <label for="note" class="block font-bold mb-3">{{ 'fields.note' | translate }}</label>
                                            <textarea id="note" pInputText rows="3" formControlName="note" fluid [readonly]="viewOnly" [disabled]="submitting"></textarea>
                                        </div>
                                    </div>
                                    <div class="flex justify-end gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextFromStep1()" [disabled]="submitting"></p-button>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="2">
                                <ng-template #content>
                                    <div class="mt-2">
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
                                                    <app-form-errors [control]="timeGroup.get('day')" [show]="step2Submitted"></app-form-errors>
                                                </div>
                                                <div>
                                                    <label class="block font-bold mb-3">{{ 'fields.start_hour' | translate }} <span class="text-red-500">*</span></label>
                                                    <input type="number" step="0.25" min="0" max="23.99" pInputText formControlName="startHour" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                                    <app-form-errors [control]="timeGroup.get('startHour')" [show]="step2Submitted"></app-form-errors>
                                                </div>
                                                <div>
                                                    <label class="block font-bold mb-3">{{ 'fields.end_hour' | translate }} <span class="text-red-500">*</span></label>
                                                    <input type="number" step="0.25" min="0" max="23.99" pInputText formControlName="endHour" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                                    <app-form-errors [control]="timeGroup.get('endHour')" [show]="step2Submitted"></app-form-errors>
                                                </div>
                                                <div class="flex md:justify-end">
                                                    <p-button type="button" icon="pi pi-trash" severity="danger" text (onClick)="removeTime(i)" [disabled]="submitting || viewOnly"></p-button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex justify-between gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 1" [disabled]="submitting"></p-button>
                                        <p-button class="wizard-nav-btn" [label]="'common.save_course' | translate" icon="pi pi-check" iconPos="right" (onClick)="nextFromStep2()" [disabled]="submitting"></p-button>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="3">
                                <ng-template #content>
                                    <div class="flex items-center justify-between mb-3">
                                        <label for="supervisorIds" class="block font-bold">{{ 'entities.supervisors' | translate }}</label>
                                        <p-button
                                            type="button"
                                            [label]="'common.add_supervisor' | translate"
                                            icon="pi pi-plus"
                                            severity="secondary"
                                            text
                                            (onClick)="openSupervisorDialog()"
                                            [disabled]="submitting || viewOnly"
                                        />
                                    </div>
                                    <p-multiselect
                                        id="supervisorIds"
                                        [options]="supervisorOptions"
                                        formControlName="supervisorIds"
                                        appendTo="body"
                                        [disabled]="submitting || viewOnly"
                                        [filter]="true"
                                        [placeholder]="'common.select_supervisors' | translate"
                                        display="chip"
                                        [maxSelectedLabels]="1000"
                                        styleClass="w-full"
                                    />
                                    <div class="flex justify-between gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 2" [disabled]="submitting"></p-button>
                                        <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="saveSupervisors()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
                                    </div>
                                </ng-template>
                            </p-step-panel>
                        </p-step-panels>
                    </p-stepper>
                </form>
            </ng-template>

        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />

        <p-dialog [(visible)]="supervisorDialog" [style]="{ width: '520px' }" [header]="'pages.supervisors.details_title' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="supervisorForm">
                    <input type="hidden" formControlName="roleId" />
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="supervisorUsername" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="supervisorUsername" formControlName="username" required fluid [disabled]="supervisorSubmitting" />
                            <app-form-errors [control]="supervisorForm.get('username')" [show]="supervisorSubmitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="supervisorPassword" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                            <p-password id="supervisorPassword" formControlName="password" [toggleMask]="true" [feedback]="false" [fluid]="true" [disabled]="supervisorSubmitting"></p-password>
                            <app-form-errors [control]="supervisorForm.get('password')" [show]="supervisorSubmitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="supervisorEmail" class="block font-bold mb-3">{{ 'fields.email' | translate }}</label>
                            <input type="text" pInputText id="supervisorEmail" formControlName="email" fluid [disabled]="supervisorSubmitting" />
                            <app-form-errors [control]="supervisorForm.get('email')" [show]="supervisorSubmitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="supervisorPhone" class="block font-bold mb-3">{{ 'fields.phone' | translate }}</label>
                            <input type="text" pInputText id="supervisorPhone" formControlName="phone" fluid [disabled]="supervisorSubmitting" />
                        </div>
                        <div>
                            <label for="supervisorFirstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="supervisorFirstName" formControlName="firstName" required fluid [disabled]="supervisorSubmitting" />
                            <app-form-errors [control]="supervisorForm.get('firstName')" [show]="supervisorSubmitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="supervisorLastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="supervisorLastName" formControlName="lastName" required fluid [disabled]="supervisorSubmitting" />
                            <app-form-errors [control]="supervisorForm.get('lastName')" [show]="supervisorSubmitted"></app-form-errors>
                        </div>
                    </div>
                </form>
            </ng-template>
            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="closeSupervisorDialog()" [disabled]="supervisorSubmitting" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="createSupervisor()" [loading]="supervisorSubmitting" [disabled]="supervisorSubmitting" />
            </ng-template>
        </p-dialog>
    `,
    providers: [MessageService, ConfirmationService]
})
export class CoursesCrud implements OnInit {
    courseDialog: boolean = false;
    viewOnly: boolean = false;
    supervisorDialog: boolean = false;

    courses = signal<Course[]>([]);
    meta = signal<CoursesMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;

    supervisors = signal<Supervisor[]>([]);
    supervisorOptions: { label: string; value: string }[] = [];
    supervisorsLoading: boolean = false;
    roles = signal<Role[]>([]);
    rolesLoading: boolean = false;

    courseForm: FormGroup;
    supervisorForm: FormGroup;
    currentCourseId?: string;
    courseCreatedId?: string;

    selectedCourses!: Course[] | null;

    submitted: boolean = false;
    submitting: boolean = false;
    supervisorSubmitted: boolean = false;
    supervisorSubmitting: boolean = false;
    activeStep = 1;
    step1Submitted = false;
    step2Submitted = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];
    courseTypeOptions: { label: string; value: CourseType }[] = [];
    weekDayOptions: { label: string; value: WeekDay }[] = [];

    constructor(
        private courseService: CourseService,
        private courseSupervisorsService: CourseSupervisorsService,
        private supervisorService: SupervisorService,
        private roleService: RoleService,
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
            supervisorIds: [[]],
            times: this.fb.array([])
        });
        this.supervisorForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
            password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            email: ['', Validators.email],
            phone: [''],
            roleId: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required]
        });
    }

    get times(): FormArray {
        return this.courseForm.get('times') as FormArray;
    }

    ngOnInit() {
        this.loadCourses(1, 10);
        this.loadSupervisors();
        this.loadRoles();
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
        this.courseCreatedId = undefined;
        this.submitted = false;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.activeStep = 1;
        const nowLocal = this.toDatetimeLocal(new Date().toISOString());
        this.courseForm.reset({
            courseName: '',
            type: '',
            startDate: nowLocal,
            endDate: '',
            note: '',
            supervisorIds: []
        });
        this.times.clear();
        this.addTime();
        this.courseForm.enable();
        this.courseDialog = true;
    }

    editCourse(course: Course) {
        this.viewOnly = false;
        this.courseCreatedId = String(course.id ?? '');
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.activeStep = 1;
        this.courseDialog = true;
        this.courseService.get(course.id as string).subscribe((data) => {
            this.currentCourseId = data.id as string;
            this.courseForm.reset({
                courseName: data.name ?? '',
                type: data.type ?? '',
                startDate: this.toDatetimeLocal(data.startDate),
                endDate: this.toDatetimeLocal(data.endDate),
                note: data.note ?? '',
                supervisorIds: []
            });
            if (data.id) {
                this.loadCourseSupervisors(data.id);
            }
            this.times.clear();
            (data.times ?? []).forEach((time) => this.times.push(this.createTimeGroup(time.day, time.startHour, time.endHour)));
            this.courseForm.enable();
        });
    }

    viewCourse(course: Course) {
        this.viewOnly = true;
        this.courseCreatedId = String(course.id ?? '');
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.activeStep = 1;
        this.courseDialog = true;
        this.courseService.get(course.id as string).subscribe((data) => {
            this.currentCourseId = data.id as string;
            this.courseForm.reset({
                courseName: data.name ?? '',
                type: data.type ?? '',
                startDate: this.toDatetimeLocal(data.startDate),
                endDate: this.toDatetimeLocal(data.endDate),
                note: data.note ?? '',
                supervisorIds: []
            });
            if (data.id) {
                this.loadCourseSupervisors(data.id);
            }
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
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.activeStep = 1;
        this.courseCreatedId = undefined;
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
        this.step1Submitted = true;
        this.step2Submitted = true;
        if (this.submitting) return;
        if (this.courseForm.invalid) {
            if (!this.isStep1Valid()) {
                this.activeStep = 1;
            } else if (!this.isStep2Valid()) {
                this.activeStep = 2;
            }
            return;
        }

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
                    this.courseCreatedId = String(this.currentCourseId);
                    this.activeStep = 3;
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
            next: (created) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translate.instant('common.successful'),
                    detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.course') }),
                    life: 3000
                });
                this.courseCreatedId = String(created.id ?? '');
                this.currentCourseId = created.id !== undefined && created.id !== null ? String(created.id) : this.currentCourseId;
                this.activeStep = 3;
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

    nextFromStep1() {
        this.step1Submitted = true;
        if (this.isStep1Valid()) {
            this.activeStep = 2;
        }
    }

    nextFromStep2() {
        this.step2Submitted = true;
        if (this.isStep2Valid()) {
            this.saveCourse();
        }
    }

    saveSupervisors() {
        const supervisorIds = (this.courseForm.get('supervisorIds')?.value ?? [])
            .map((id: string | number) => String(id))
            .filter(Boolean);
        this.submitting = true;
        this.assignSupervisors(this.courseCreatedId ?? this.currentCourseId, supervisorIds, () => {
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
            this.courseCreatedId = undefined;
            this.activeStep = 1;
        });
    }

    private isStep1Valid(): boolean {
        const fields = ['courseName', 'type', 'startDate', 'endDate'];
        fields.forEach((field) => this.courseForm.get(field)?.markAsTouched());
        return fields.every((field) => this.courseForm.get(field)?.valid);
    }

    private isStep2Valid(): boolean {
        return this.times.controls.every((group) => group.valid);
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

    private loadSupervisors() {
        if (this.supervisorsLoading) return;
        this.supervisorsLoading = true;
        this.supervisorService.list(1, 100, RoleName.Supervisor).subscribe({
            next: (res) => {
                this.supervisors.set(res?.data ?? []);
                this.setSupervisorOptions();
                this.supervisorsLoading = false;
            },
            error: () => {
                this.supervisorsLoading = false;
            }
        });
    }

    private loadRoles() {
        if (this.rolesLoading) return;
        this.rolesLoading = true;
        this.roleService.list(1, 100).subscribe({
            next: (res) => {
                this.roles.set(res?.data ?? []);
                this.rolesLoading = false;
            },
            error: () => {
                this.rolesLoading = false;
            }
        });
    }

    private setSupervisorOptions() {
        this.supervisorOptions = this.supervisors().map((supervisor) => ({
            label: this.supervisorLabel(supervisor),
            value: String(supervisor.id)
        }));
    }

    private supervisorLabel(supervisor: Supervisor): string {
        const firstName = supervisor.profile?.firstName ?? '';
        const lastName = supervisor.profile?.lastName ?? '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
        return supervisor.username ?? String(supervisor.id);
    }

    openSupervisorDialog() {
        this.supervisorSubmitted = false;
        this.supervisorForm.reset({
            username: '',
            password: '',
            email: '',
            phone: '',
            roleId: this.getSupervisorRoleId(),
            firstName: '',
            lastName: ''
        });
        this.supervisorForm.enable();
        this.supervisorDialog = true;
    }

    closeSupervisorDialog() {
        this.supervisorDialog = false;
        this.supervisorSubmitted = false;
        this.supervisorSubmitting = false;
        this.supervisorForm.enable();
    }

    createSupervisor() {
        this.supervisorSubmitted = true;
        if (this.supervisorSubmitting || this.supervisorForm.invalid) return;
        const formValue = this.supervisorForm.getRawValue();
        const payload: any = this.stripEmpty({
            username: formValue.username,
            email: formValue.email,
            phone: formValue.phone,
            roleId: formValue.roleId,
            profile: {
                firstName: formValue.firstName,
                lastName: formValue.lastName
            }
        });
        if (formValue.password) {
            payload.password = formValue.password;
        }
        this.supervisorSubmitting = true;
        this.supervisorForm.disable();
        this.supervisorService.create(payload).subscribe({
            next: (created) => {
                const nextList = [created, ...this.supervisors()];
                this.supervisors.set(nextList);
                this.setSupervisorOptions();
                const selected = this.courseForm.get('supervisorIds')?.value ?? [];
                this.courseForm.get('supervisorIds')?.setValue([...selected, String(created.id)]);
                this.supervisorSubmitting = false;
                this.supervisorDialog = false;
                this.supervisorForm.enable();
            },
            error: () => {
                this.supervisorSubmitting = false;
                this.supervisorForm.enable();
            }
        });
    }

    private getSupervisorRoleId(): string {
        const role = this.roles().find((item) => item.name === RoleName.Supervisor);
        return role?.id !== undefined && role?.id !== null ? String(role.id) : '';
    }

    private assignSupervisors(courseId: string | number | undefined, supervisorIds: string[], onDone: () => void) {
        if (!courseId || !supervisorIds.length) {
            onDone();
            return;
        }
        this.courseSupervisorsService.assign(courseId, supervisorIds).subscribe({
            next: () => onDone(),
            error: () => {
                this.submitting = false;
                this.courseForm.enable();
            }
        });
    }

    private loadCourseSupervisors(courseId: string | number) {
        this.courseSupervisorsService.listByCourse(courseId, 1, 100).subscribe({
            next: (res) => {
                const supervisorIds = (res?.data ?? [])
                    .map((item) => item.actorId ?? item.actor?.id)
                    .filter((id): id is string => !!id)
                    .map((id) => String(id));
                this.courseForm.get('supervisorIds')?.setValue(supervisorIds);
            }
        });
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

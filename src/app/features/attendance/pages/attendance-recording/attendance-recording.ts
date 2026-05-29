import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AttendanceService } from '@/app/features/attendance/services/attendance.service';
import { AttendanceStatus } from '@/app/features/attendance/models/attendance-status.enum';
import { AttendanceEntity, AttendanceMeta } from '@/app/features/attendance/models/attendance.model';
import { NotificationService } from '@/app/core/services/notification.service';
import { CourseService } from '@/app/features/courses/services/course.service';
import { CourseGroupsService, CourseGroup } from '@/app/features/courses/services/course-groups.service';
import { GroupStudentsService, GroupStudentItem } from '@/app/features/courses/services/group-students.service';

@Component({
    selector: 'app-attendance-recording',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ReactiveFormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        DatePickerModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        TagModule,
        ToolbarModule,
        TranslateModule
    ],
    providers: [ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" (onClick)="openNew()" />
            </ng-template>
            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="dt.exportCSV()" />
            </ng-template>
        </p-toolbar>

        <div class="card">
            <div class="flex flex-wrap items-end gap-4 mb-6">
                <div class="flex-1 min-w-[14rem]">
                    <label class="block font-bold mb-2">{{ 'entities.courses' | translate }}</label>
                    <p-select
                        [options]="courseOptions"
                        optionLabel="label"
                        optionValue="value"
                        [(ngModel)]="filterCourseId"
                        [ngModelOptions]="{ standalone: true }"
                        appendTo="body"
                        [placeholder]="'common.select_course' | translate"
                        [showClear]="true"
                        (onChange)="onFilterCourseChange()"
                        styleClass="w-full"
                    />
                </div>
                <div class="flex-1 min-w-[14rem]">
                    <label class="block font-bold mb-2">{{ 'entities.groups' | translate }}</label>
                    <p-select
                        [options]="filterGroupOptions"
                        optionLabel="label"
                        optionValue="value"
                        [(ngModel)]="filterGroupId"
                        [ngModelOptions]="{ standalone: true }"
                        appendTo="body"
                        [disabled]="!filterCourseId"
                        [placeholder]="'common.select_group' | translate"
                        [showClear]="true"
                        (onChange)="loadAttendance(1)"
                        styleClass="w-full"
                    />
                </div>
                <div class="flex-1 min-w-[14rem]">
                    <label class="block font-bold mb-2">{{ 'fields.attended_at' | translate }}</label>
                    <p-datepicker
                        [(ngModel)]="filterStartDate"
                        [ngModelOptions]="{ standalone: true }"
                        appendTo="body"
                        [showIcon]="true"
                        dateFormat="yy-mm-dd"
                        [showClear]="true"
                        (onChange)="loadAttendance(1)"
                        styleClass="w-full"
                    />
                </div>
                <div class="flex-1 min-w-[14rem]">
                    <label class="block font-bold mb-2">{{ 'fields.attended_end' | translate }}</label>
                    <p-datepicker
                        [(ngModel)]="filterEndDate"
                        [ngModelOptions]="{ standalone: true }"
                        appendTo="body"
                        [showIcon]="true"
                        dateFormat="yy-mm-dd"
                        [showClear]="true"
                        (onChange)="loadAttendance(1)"
                        styleClass="w-full"
                    />
                </div>
                <p-button icon="pi pi-refresh" [outlined]="true" (onClick)="loadAttendance(meta().page)" [disabled]="loading" [style]="{ 'align-self': 'flex-end', 'margin-bottom': '0.25rem' }" />
            </div>

            <p-table
                #dt
                [value]="records()"
                [loading]="loading"
                [rows]="10"
                [paginator]="true"
                [tableStyle]="{ 'min-width': '60rem' }"
                [rowHover]="true"
                dataKey="id"
                [currentPageReportTemplate]="'common.page_report' | translate"
                [showCurrentPageReport]="true"
                [rowsPerPageOptions]="[10, 20, 30]"
                [totalRecords]="meta().total"
                [lazy]="true"
                (onPage)="onPage($event)"
            >
                <ng-template #header>
                    <tr>
                        <th>{{ 'fields.student_name' | translate }}</th>
                        <th>{{ 'entities.course' | translate }}</th>
                        <th>{{ 'entities.groups' | translate }}</th>
                        <th>{{ 'fields.attendance_status' | translate }}</th>
                        <th>{{ 'fields.attended_at' | translate }}</th>
                        <th>{{ 'fields.note' | translate }}</th>
                    </tr>
                </ng-template>
                <ng-template #body let-record>
                    <tr>
                        <td>{{ studentName(record) }}</td>
                        <td>{{ record.course?.name || '-' }}</td>
                        <td>{{ record.group?.name || '-' }}</td>
                        <td>
                            <p-tag [value]="statusLabel(record.status)" [severity]="statusSeverity(record.status)" />
                        </td>
                        <td>{{ record.attendedAt | date:'medium' }}</td>
                        <td>{{ record.notes || '-' }}</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6" class="text-center py-8 text-surface-500">{{ 'common.no_data' | translate }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog
            [header]="(editingId ? 'common.edit' : 'common.new') | translate"
            [(visible)]="dialogVisible"
            [modal]="true"
            [draggable]="true"
            [resizable]="true"
            [style]="{ width: '480px' }"
            (onHide)="resetForm()"
        >
            <form [formGroup]="form" class="flex flex-col gap-4">
                <div>
                    <label class="block font-bold mb-2">{{ 'entities.courses' | translate }}</label>
                    <p-select
                        formControlName="courseId"
                        [options]="courseOptions"
                        optionLabel="label"
                        optionValue="value"
                        appendTo="body"
                        [placeholder]="'common.select_course' | translate"
                        styleClass="w-full"
                        (onChange)="onFormCourseChange()"
                    />
                </div>
                <div>
                    <label class="block font-bold mb-2">{{ 'entities.groups' | translate }}</label>
                    <p-select
                        formControlName="groupId"
                        [options]="formGroupOptions"
                        optionLabel="label"
                        optionValue="value"
                        appendTo="body"
                        [disabled]="!form.get('courseId')?.value"
                        [placeholder]="'common.select_group' | translate"
                        styleClass="w-full"
                        (onChange)="onFormGroupChange()"
                    />
                </div>
                <div>
                    <label class="block font-bold mb-2">{{ 'fields.student_name' | translate }}</label>
                    <p-select
                        formControlName="studentId"
                        [options]="formStudentOptions"
                        optionLabel="label"
                        optionValue="value"
                        appendTo="body"
                        [disabled]="!form.get('groupId')?.value"
                        [placeholder]="'common.select_status' | translate"
                        [filter]="true"
                        styleClass="w-full"
                    />
                </div>
                <div>
                    <label class="block font-bold mb-2">{{ 'fields.attendance_status' | translate }}</label>
                    <p-select
                        formControlName="status"
                        [options]="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        appendTo="body"
                        styleClass="w-full"
                    />
                </div>
                <div>
                    <label class="block font-bold mb-2">{{ 'fields.attended_at' | translate }}</label>
                    <p-datepicker
                        formControlName="attendedAt"
                        appendTo="body"
                        [showIcon]="true"
                        [showTime]="true"
                        [hourFormat]="'24'"
                        dateFormat="yy-mm-dd"
                        styleClass="w-full"
                    />
                </div>
                <div>
                    <label class="block font-bold mb-2">{{ 'fields.note' | translate }}</label>
                    <input type="text" pInputText formControlName="notes" styleClass="w-full" fluid />
                </div>
            </form>
            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" [outlined]="true" (onClick)="dialogVisible = false" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="saveRecord()" [loading]="submitting" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog />
    `
})
export class AttendanceRecording implements OnInit {
    @ViewChild('dt') dt!: Table;

    records = signal<AttendanceEntity[]>([]);
    meta = signal<AttendanceMeta>({ page: 1, perPage: 10, nextPage: null, previousPage: null, total: 0 });
    loading = false;
    submitting = false;
    dialogVisible = false;
    editingId: string | null = null;

    form!: FormGroup;

    courseOptions: { label: string; value: string }[] = [];
    filterCourseId: string | null = null;
    filterGroupId: string | null = null;
    filterStartDate: Date | null = null;
    filterEndDate: Date | null = null;

    filterGroupOptions: { label: string; value: string }[] = [];
    formGroupOptions: { label: string; value: string }[] = [];
    formStudentOptions: { label: string; value: string }[] = [];

    statusOptions: { label: string; value: AttendanceStatus }[] = [];

    constructor(
        private fb: FormBuilder,
        private attendanceService: AttendanceService,
        private courseService: CourseService,
        private courseGroupsService: CourseGroupsService,
        private groupStudentsService: GroupStudentsService,
        private notification: NotificationService,
        private confirmation: ConfirmationService,
        private translate: TranslateService
    ) {}

    ngOnInit() {
        this.setStatusOptions();
        this.loadCourses();
        this.loadAttendance(1);
        this.form = this.fb.group({
            courseId: ['', Validators.required],
            groupId: ['', Validators.required],
            studentId: ['', Validators.required],
            status: [AttendanceStatus.OnTime, Validators.required],
            attendedAt: [new Date(), Validators.required],
            notes: ['']
        });
        this.translate.onLangChange.subscribe(() => this.setStatusOptions());
    }

    onPage(event: { first: number; rows: number }) {
        this.loadAttendance(Math.floor(event.first / event.rows) + 1, event.rows);
    }

    onFilterCourseChange() {
        this.filterGroupId = null;
        this.filterGroupOptions = [];
        if (this.filterCourseId) {
            this.loadFilterGroups(this.filterCourseId);
        }
        this.loadAttendance(1);
    }

    onFormCourseChange() {
        this.form.get('groupId')?.setValue('');
        this.form.get('studentId')?.setValue('');
        this.formGroupOptions = [];
        this.formStudentOptions = [];
        const courseId = this.form.get('courseId')?.value;
        if (courseId) this.loadFormGroups(courseId);
    }

    onFormGroupChange() {
        this.form.get('studentId')?.setValue('');
        this.formStudentOptions = [];
        const groupId = this.form.get('groupId')?.value;
        if (groupId) this.loadFormStudents(groupId);
    }

    studentName(record: AttendanceEntity): string {
        const p = record.student?.profile;
        return p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : record.student?.username ?? '-';
    }

    statusLabel(status: AttendanceStatus): string {
        return this.translate.instant(`enums.attendance_status.${status}`);
    }

    statusSeverity(status: AttendanceStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case AttendanceStatus.OnTime:
            case AttendanceStatus.Early:
                return 'success';
            case AttendanceStatus.Late:
                return 'warn';
            case AttendanceStatus.JustifiedAbsence:
                return 'secondary';
            case AttendanceStatus.UnjustifiedAbsence:
                return 'danger';
            default:
                return 'info';
        }
    }

    openNew() {
        this.editingId = null;
        this.formGroupOptions = [];
        this.formStudentOptions = [];
        this.form.reset({ status: AttendanceStatus.OnTime, attendedAt: new Date() });
        this.dialogVisible = true;
    }

    openEdit(record: AttendanceEntity) {
        this.editingId = record.id;
        this.formGroupOptions = [];
        this.formStudentOptions = [];
        const courseId = String(record.course?.id ?? '');
        const groupId = String(record.group?.id ?? '');
        const studentId = String(record.student?.id ?? '');
        this.form.patchValue({
            courseId,
            groupId,
            studentId,
            status: record.status,
            attendedAt: record.attendedAt ? new Date(record.attendedAt) : new Date(),
            notes: record.notes ?? ''
        });
        if (courseId) this.loadFormGroups(courseId, () => {
            if (groupId) this.loadFormStudents(groupId);
        });
        this.dialogVisible = true;
    }

    deleteRecord(record: AttendanceEntity) {
        this.confirmation.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: this.studentName(record) }),
            accept: () => {
                this.attendanceService.delete(record.id).subscribe({
                    next: () => {
                        this.notification.success(this.translate.instant('common.deleted', { entity: this.translate.instant('entities.attendance') }));
                        this.loadAttendance(this.meta().page);
                    }
                });
            }
        });
    }

    saveRecord() {
        if (this.form.invalid || this.submitting) return;
        this.submitting = true;
        const val = this.form.value;
        const obs = this.editingId
            ? this.attendanceService.update(this.editingId, {
                status: val.status,
                attendedAt: this.toISOString(val.attendedAt),
                notes: val.notes || undefined
            })
            : this.attendanceService.create({
                courseId: val.courseId,
                groupId: val.groupId,
                studentId: val.studentId,
                status: val.status,
                attendedAt: this.toISOString(val.attendedAt),
                notes: val.notes || undefined
            });
        obs.subscribe({
            next: () => {
                this.submitting = false;
                this.dialogVisible = false;
                this.notification.success(this.translate.instant(this.editingId ? 'common.updated' : 'common.created', { entity: this.translate.instant('entities.attendance') }));
                this.loadAttendance(this.meta().page);
            },
            error: () => {
                this.submitting = false;
            }
        });
    }

    resetForm() {
        this.form.reset({ status: AttendanceStatus.OnTime, attendedAt: new Date() });
        this.editingId = null;
        this.formGroupOptions = [];
        this.formStudentOptions = [];
    }

    loadAttendance(page: number, perPage?: number) {
        this.loading = true;
        const params: any = { page, perPage: perPage ?? this.meta().perPage };
        if (this.filterCourseId) params.courseId = this.filterCourseId;
        if (this.filterGroupId) params.groupId = this.filterGroupId;
        if (this.filterStartDate) params.attendedAtStartDate = this.toISOString(this.filterStartDate);
        if (this.filterEndDate) params.attendedAtEndDate = this.toISOString(this.filterEndDate);
        this.attendanceService.list(params).subscribe({
            next: (res) => {
                this.records.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage: params.perPage, nextPage: null, previousPage: null, total: 0 });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private loadCourses() {
        this.courseService.list(1, 100).subscribe({
            next: (res) => {
                this.courseOptions = (res?.data ?? []).map((c: any) => ({ label: c.name, value: String(c.id) }));
            }
        });
    }

    private loadFilterGroups(courseId: string) {
        this.courseGroupsService.listByCourse(courseId, 1, 100).subscribe({
            next: (res) => {
                this.filterGroupOptions = (res?.data ?? []).map((g: CourseGroup) => ({ label: g.name, value: String(g.id) }));
            }
        });
    }

    private loadFormGroups(courseId: string, callback?: () => void) {
        this.courseGroupsService.listByCourse(courseId, 1, 100).subscribe({
            next: (res) => {
                this.formGroupOptions = (res?.data ?? []).map((g: CourseGroup) => ({ label: g.name, value: String(g.id) }));
                callback?.();
            }
        });
    }

    private loadFormStudents(groupId: string) {
        this.groupStudentsService.listByGroup(groupId, 1, 100).subscribe({
            next: (res) => {
                this.formStudentOptions = (res?.data ?? []).map((item: GroupStudentItem) => ({
                    label: `${item.student?.profile?.firstName ?? ''} ${item.student?.profile?.lastName ?? ''}`.trim(),
                    value: String(item.studentId)
                }));
            }
        });
    }

    private setStatusOptions() {
        this.statusOptions = Object.values(AttendanceStatus).map((value) => ({
            label: this.translate.instant(`enums.attendance_status.${value}`),
            value
        }));
    }


    private toISOString(d: Date): string {
        if (!d) return '';
        return new Date(d).toISOString();
    }
}

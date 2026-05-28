import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseGroupsListService } from '@/app/features/course-groups/services/course-groups-list.service';
import { CourseGroup, CourseGroupsMeta } from '@/app/features/course-groups/models/course-group.model';
import { CourseService } from '@/app/features/courses/services/course.service';
import { CourseGroupsService } from '@/app/features/courses/services/course-groups.service';
import { GroupTeachersService } from '@/app/features/courses/services/group-teachers.service';
import { GroupStudentsService } from '@/app/features/courses/services/group-students.service';
import { GroupTeacherType } from '@/app/features/courses/models/group-teacher-type.enum';
import { TeacherService } from '@/app/features/teachers/services/teacher.service';
import { Teacher } from '@/app/features/teachers/models/teacher.model';
import { StudentService } from '@/app/features/students/services/student.service';
import { Student } from '@/app/features/students/models/student.model';
import { RoleName } from '@/app/core/constants/role-name.enum';
import { NotificationService } from '@/app/core/services/notification.service';
import { forkJoin } from 'rxjs';

interface Column {
    field: string;
    header: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

interface Person {
    id: string;
    name: string;
}

const TEACHER_ROLE_FILTER = RoleName.Teacher;
const STUDENT_ROLE_FILTER = RoleName.Student;

@Component({
    selector: 'app-course-groups-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        StepperModule,
        TabsModule,
        TagModule,
        ToastModule,
        IconFieldModule,
        InputIconModule,
        TranslateModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <div class="font-semibold text-xl">{{ 'pages.groups.manage_title' | translate }}</div>
            </ng-template>
            <ng-template #end>
                <p-button [label]="'common.create_group' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openCreateDialog()" />
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="groups()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'courseName', 'courseId']"
            [tableStyle]="{ 'min-width': '75rem' }"
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
                    <h5 class="m-0">{{ 'pages.groups.manage_title' | translate }}</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" [placeholder]="'common.search' | translate" />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="name" style="min-width: 18rem">
                        {{ 'fields.group_name' | translate }}
                        <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="courseName" style="min-width: 16rem">
                        {{ 'entities.course' | translate }}
                        <p-sortIcon field="courseName" />
                    </th>
                    <th style="min-width: 10rem">{{ 'entities.teachers' | translate }}</th>
                    <th style="min-width: 10rem">{{ 'entities.students' | translate }}</th>
                    <th pSortableColumn="createdAt" style="min-width: 14rem">
                        {{ 'fields.created_at' | translate }}
                        <p-sortIcon field="createdAt" />
                    </th>
                    <th style="min-width: 12rem">{{ 'common.actions' | translate }}</th>
                </tr>
            </ng-template>
            <ng-template #body let-group>
                <tr>
                    <td style="min-width: 18rem">{{ displayValue(group.name) }}</td>
                    <td style="min-width: 16rem">{{ displayValue(group.courseName || group.course?.name || group.courseId) }}</td>
                    <td style="min-width: 10rem">{{ displayValue(group.teacherCount) }}</td>
                    <td style="min-width: 10rem">{{ displayValue(group.studentCount) }}</td>
                    <td style="min-width: 14rem">{{ group.createdAt ? (group.createdAt | date: 'medium') : '-' }}</td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewGroup(group)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editGroup(group)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteGroup(group)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="createDialogVisible" [style]="{ width: '720px' }" [header]="'common.create_group' | translate" [modal]="true" [draggable]="false" [maximizable]="true">
            <p-stepper [value]="createStep">
                <p-step-list>
                    <p-step [value]="1">{{ 'common.details' | translate }}</p-step>
                    <p-step [value]="2" [disabled]="!createdGroupId">{{ 'entities.teachers' | translate }}</p-step>
                    <p-step [value]="3" [disabled]="!createdGroupId">{{ 'entities.students' | translate }}</p-step>
                </p-step-list>
                <p-step-panels>
                    <p-step-panel [value]="1">
                        <ng-template #content>
                            <div class="flex flex-col gap-4">
                                <div>
                                    <label for="selectCourse" class="block font-bold mb-3">{{ 'entities.course' | translate }} <span class="text-red-500">*</span></label>
                                    <p-select
                                        id="selectCourse"
                                        [options]="courseOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        [(ngModel)]="selectedCourseId"
                                        [ngModelOptions]="{ standalone: true }"
                                        appendTo="body"
                                        [disabled]="createSubmitting"
                                        [placeholder]="'common.select_course' | translate"
                                        styleClass="w-full"
                                    />
                                </div>
                                <div>
                                    <label for="newGroupName" class="block font-bold mb-3">{{ 'fields.group_name' | translate }} <span class="text-red-500">*</span></label>
                                    <input type="text" pInputText id="newGroupName" [(ngModel)]="newGroupName" [ngModelOptions]="{ standalone: true }" [disabled]="createSubmitting" fluid />
                                </div>
                                <div class="flex justify-end gap-2 mt-4">
                                    <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="closeCreateDialog()" [disabled]="createSubmitting" />
                                    <p-button [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="createGroupAndContinue()" [loading]="createSubmitting" [disabled]="!selectedCourseId || !newGroupName.trim() || createSubmitting" />
                                </div>
                            </div>
                        </ng-template>
                    </p-step-panel>
                    <p-step-panel [value]="2">
                        <ng-template #content>
                            <div class="flex items-center justify-between mb-4">
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [placeholder]="'common.search' | translate" (input)="onDialogFilter($event, 'teachers')" />
                                </p-iconfield>
                                <span class="text-sm text-surface-500">{{ dialogTeachersSelection.length || 0 }} {{ 'entities.teachers' | translate }}</span>
                            </div>
                            <p-table
                                [value]="dialogFilteredTeachers"
                                dataKey="id"
                                selectionMode="multiple"
                                [(selection)]="dialogTeachersSelection"
                                (selectionChange)="syncDialogTeacherTypes($event)"
                                [tableStyle]="{ 'min-width': '36rem' }"
                            >
                                <ng-template #header>
                                    <tr>
                                        <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                                        <th>{{ 'fields.name' | translate }}</th>
                                        <th style="width: 12rem">{{ 'fields.teacher_type' | translate }}</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-teacher>
                                    <tr>
                                        <td><p-tableCheckbox [value]="teacher" /></td>
                                        <td>{{ displayValue(teacher.name) }}</td>
                                        <td>
                                            <p-select
                                                [options]="teacherTypeOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                [(ngModel)]="dialogTeacherTypes[teacher.id]"
                                                [ngModelOptions]="{ standalone: true }"
                                                appendTo="body"
                                                [disabled]="!dialogTeachersSelection.some((t) => t.id === teacher.id) || assigning"
                                                [placeholder]="'common.select_type' | translate"
                                                styleClass="w-full"
                                            />
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                            <div class="flex justify-between gap-2 mt-6">
                                <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="createStep = 1" [disabled]="assigning" />
                                <p-button [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="assignTeachers()" [loading]="assigning" [disabled]="assigning" />
                            </div>
                        </ng-template>
                    </p-step-panel>
                    <p-step-panel [value]="3">
                        <ng-template #content>
                            <div class="flex items-center justify-between mb-4">
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [placeholder]="'common.search' | translate" (input)="onDialogFilter($event, 'students')" />
                                </p-iconfield>
                                <span class="text-sm text-surface-500">{{ dialogStudentsSelection.length || 0 }} {{ 'entities.students' | translate }}</span>
                            </div>
                            <p-table
                                [value]="dialogFilteredStudents"
                                dataKey="id"
                                selectionMode="multiple"
                                [(selection)]="dialogStudentsSelection"
                                [tableStyle]="{ 'min-width': '36rem' }"
                            >
                                <ng-template #header>
                                    <tr>
                                        <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                                        <th>{{ 'fields.name' | translate }}</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-student>
                                    <tr>
                                        <td><p-tableCheckbox [value]="student" /></td>
                                        <td>{{ displayValue(student.name) }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                            <div class="flex justify-between gap-2 mt-6">
                                <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="createStep = 2" [disabled]="assigning" />
                                <p-button [label]="'common.finish' | translate" icon="pi pi-check" (onClick)="assignStudents()" [loading]="assigning" [disabled]="assigning" />
                            </div>
                        </ng-template>
                    </p-step-panel>
                </p-step-panels>
            </p-stepper>
        </p-dialog>

        <p-dialog [(visible)]="groupDialogVisible" [style]="{ width: '720px' }" [header]="groupDialogTitle" [modal]="true" [draggable]="false" [maximizable]="true">
            <ng-template #content>
                <p-tabs [value]="groupDialogTab" (valueChange)="setGroupDialogTab($event)">
                    <p-tablist>
                        <p-tab value="details">{{ 'common.details' | translate }}</p-tab>
                        <p-tab value="teachers">{{ 'entities.teachers' | translate }}</p-tab>
                        <p-tab value="students">{{ 'entities.students' | translate }}</p-tab>
                    </p-tablist>
                    <p-tabpanels>
                        <p-tabpanel value="details">
                            <div class="flex flex-col gap-4">
                                <div>
                                    <label class="block font-bold mb-3">{{ 'entities.course' | translate }}</label>
                                    <p class="m-0 text-surface-700">{{ currentGroupCourseName }}</p>
                                </div>
                                <div>
                                    <label for="editGroupName" class="block font-bold mb-3">{{ 'fields.group_name' | translate }}</label>
                                    <input
                                        type="text"
                                        pInputText
                                        id="editGroupName"
                                        [(ngModel)]="editGroupName"
                                        [ngModelOptions]="{ standalone: true }"
                                        [disabled]="groupDialogViewOnly || groupDialogSubmitting"
                                        fluid
                                    />
                                </div>
                            </div>
                        </p-tabpanel>
                        <p-tabpanel value="teachers">
                            <ng-container *ngIf="groupDialogViewOnly; else editTeachers">
                                <div class="flex items-center justify-between mb-4">
                                    <span class="text-sm text-surface-500">{{ memberTeachers.length }} {{ 'entities.teachers' | translate }}</span>
                                </div>
                                <p-table [value]="memberTeachers" [loading]="membersLoading" [tableStyle]="{ 'min-width': '30rem' }">
                                    <ng-template #header>
                                        <tr>
                                            <th>{{ 'fields.name' | translate }}</th>
                                            <th style="width: 10rem">{{ 'fields.teacher_type' | translate }}</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template #body let-teacher>
                                        <tr>
                                            <td>{{ displayValue(teacher.name) }}</td>
                                            <td>
                                                <p-tag [value]="teacherTypeLabel(teacher.type)" [severity]="teacher.type === 'MAIN' ? 'success' : 'info'" />
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                                <p class="mt-3 text-sm text-surface-500" *ngIf="!memberTeachers.length">{{ 'common.no_teachers_selected' | translate }}</p>
                            </ng-container>
                            <ng-template #editTeachers>
                                <div class="flex items-center justify-between mb-4">
                                    <p-iconfield>
                                        <p-inputicon styleClass="pi pi-search" />
                                        <input pInputText type="text" [placeholder]="'common.search' | translate" (input)="onEditMembersFilter($event, 'teachers')" />
                                    </p-iconfield>
                                    <span class="text-sm text-surface-500">{{ editTeachersSelection.length || 0 }} {{ 'entities.teachers' | translate }}</span>
                                </div>
                                <p-table
                                    [value]="editFilteredTeachers"
                                    dataKey="id"
                                    selectionMode="multiple"
                                    [(selection)]="editTeachersSelection"
                                    (selectionChange)="syncEditTeacherTypes($event)"
                                    [loading]="membersLoading"
                                    [tableStyle]="{ 'min-width': '36rem' }"
                                >
                                    <ng-template #header>
                                        <tr>
                                            <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                                            <th>{{ 'fields.name' | translate }}</th>
                                            <th style="width: 12rem">{{ 'fields.teacher_type' | translate }}</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template #body let-teacher>
                                        <tr>
                                            <td><p-tableCheckbox [value]="teacher" /></td>
                                            <td>{{ displayValue(teacher.name) }}</td>
                                            <td>
                                                <p-select
                                                    [options]="teacherTypeOptions"
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    [(ngModel)]="editTeacherTypes[teacher.id]"
                                                    [ngModelOptions]="{ standalone: true }"
                                                    appendTo="body"
                                                    [disabled]="!editTeachersSelection.some((t) => t.id === teacher.id) || groupDialogSubmitting"
                                                    [placeholder]="'common.select_type' | translate"
                                                    styleClass="w-full"
                                                />
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </ng-template>
                        </p-tabpanel>
                        <p-tabpanel value="students">
                            <ng-container *ngIf="groupDialogViewOnly; else editStudents">
                                <div class="flex items-center justify-between mb-4">
                                    <span class="text-sm text-surface-500">{{ memberStudents.length }} {{ 'entities.students' | translate }}</span>
                                </div>
                                <p-table [value]="memberStudents" [loading]="membersLoading" [tableStyle]="{ 'min-width': '30rem' }">
                                    <ng-template #header>
                                        <tr>
                                            <th>{{ 'fields.name' | translate }}</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template #body let-student>
                                        <tr>
                                            <td>{{ displayValue(student.name) }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                                <p class="mt-3 text-sm text-surface-500" *ngIf="!memberStudents.length">{{ 'common.no_students_selected' | translate }}</p>
                            </ng-container>
                            <ng-template #editStudents>
                                <div class="flex items-center justify-between mb-4">
                                    <p-iconfield>
                                        <p-inputicon styleClass="pi pi-search" />
                                        <input pInputText type="text" [placeholder]="'common.search' | translate" (input)="onEditMembersFilter($event, 'students')" />
                                    </p-iconfield>
                                    <span class="text-sm text-surface-500">{{ editStudentsSelection.length || 0 }} {{ 'entities.students' | translate }}</span>
                                </div>
                                <p-table
                                    [value]="editFilteredStudents"
                                    dataKey="id"
                                    selectionMode="multiple"
                                    [(selection)]="editStudentsSelection"
                                    [loading]="membersLoading"
                                    [tableStyle]="{ 'min-width': '36rem' }"
                                >
                                    <ng-template #header>
                                        <tr>
                                            <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                                            <th>{{ 'fields.name' | translate }}</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template #body let-student>
                                        <tr>
                                            <td><p-tableCheckbox [value]="student" /></td>
                                            <td>{{ displayValue(student.name) }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </ng-template>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </ng-template>
            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="closeGroupDialog()" [disabled]="groupDialogSubmitting" />
                <p-button *ngIf="!groupDialogViewOnly" [label]="'common.save' | translate" icon="pi pi-check" (click)="saveGroup()" [loading]="groupDialogSubmitting" [disabled]="groupDialogSubmitting" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class CourseGroupsList implements OnInit {
    groups = signal<CourseGroup[]>([]);
    meta = signal<CourseGroupsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    createDialogVisible = false;
    createStep = 1;
    selectedCourseId = '';
    newGroupName = '';
    createdGroupId?: string;
    createSubmitting = false;
    assigning = false;

    courseOptions: { label: string; value: string }[] = [];
    allTeachers: Person[] = [];
    allStudents: Person[] = [];
    dialogTeachersSelection: Person[] = [];
    dialogStudentsSelection: Person[] = [];
    dialogTeacherTypes: Record<string, GroupTeacherType> = {};
    dialogFilteredTeachers: Person[] = [];
    dialogFilteredStudents: Person[] = [];
    teacherTypeOptions: { label: string; value: GroupTeacherType }[] = [];

    groupDialogVisible = false;
    groupDialogViewOnly = false;
    groupDialogTab = 'details';
    groupDialogSubmitting = false;
    currentGroupId?: string;
    currentGroupCourseName = '';
    editGroupName = '';

    memberTeachers: Array<{ id: string; name: string; type: GroupTeacherType }> = [];
    memberStudents: Person[] = [];
    membersLoading = false;

    editTeachersSelection: Person[] = [];
    editStudentsSelection: Person[] = [];
    editTeacherTypes: Record<string, GroupTeacherType> = {};
    editFilteredTeachers: Person[] = [];
    editFilteredStudents: Person[] = [];

    constructor(
        private groupsService: CourseGroupsListService,
        private courseGroupsService: CourseGroupsService,
        private courseService: CourseService,
        private groupTeachersService: GroupTeachersService,
        private groupStudentsService: GroupStudentsService,
        private teacherService: TeacherService,
        private studentService: StudentService,
        private notification: NotificationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private translate: TranslateService
    ) {}

    ngOnInit() {
        this.loadGroups(1, 10);
        this.setColumns();
        this.setTeacherTypeOptions();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
            this.setTeacherTypeOptions();
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    loadGroups(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.groupsService.list(page, perPage).subscribe({
            next: (res) => {
                this.groups.set(res?.data ?? []);
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

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadGroups(page, perPage);
    }

    openCreateDialog() {
        this.createStep = 1;
        this.selectedCourseId = '';
        this.newGroupName = '';
        this.createdGroupId = undefined;
        this.createSubmitting = false;
        this.assigning = false;
        this.dialogTeachersSelection = [];
        this.dialogStudentsSelection = [];
        this.dialogTeacherTypes = {};
        this.dialogFilteredTeachers = [...this.allTeachers];
        this.dialogFilteredStudents = [...this.allStudents];
        this.createDialogVisible = true;
        this.loadCourses();
        this.loadTeachersAndStudents();
    }

    closeCreateDialog() {
        this.createDialogVisible = false;
    }

    createGroupAndContinue() {
        if (!this.selectedCourseId || !this.newGroupName.trim() || this.createSubmitting) return;
        this.createSubmitting = true;
        this.courseGroupsService.create({ name: this.newGroupName.trim(), courseId: this.selectedCourseId }).subscribe({
            next: (created) => {
                this.createdGroupId = String(created.id);
                this.createSubmitting = false;
                this.createStep = 2;
            },
            error: () => {
                this.createSubmitting = false;
            }
        });
    }

    syncDialogTeacherTypes(selection: Person[] | null | undefined) {
        const selected = selection ?? [];
        selected.forEach((teacher) => {
            if (!this.dialogTeacherTypes[teacher.id]) {
                this.dialogTeacherTypes[teacher.id] = GroupTeacherType.Main;
            }
        });
        const selectedIds = new Set(selected.map((t) => t.id));
        Object.keys(this.dialogTeacherTypes).forEach((id) => {
            if (!selectedIds.has(id)) {
                delete this.dialogTeacherTypes[id];
            }
        });
    }

    onDialogFilter(event: Event, type: 'teachers' | 'students') {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        if (type === 'teachers') {
            this.dialogFilteredTeachers = this.allTeachers.filter((t) => t.name.toLowerCase().includes(query));
        } else {
            this.dialogFilteredStudents = this.allStudents.filter((s) => s.name.toLowerCase().includes(query));
        }
    }

    assignTeachers() {
        if (!this.createdGroupId || this.assigning) return;
        this.assigning = true;
        if (!this.dialogTeachersSelection.length) {
            this.assigning = false;
            this.createStep = 3;
            return;
        }
        const ops = this.dialogTeachersSelection.map((teacher) =>
            this.groupTeachersService.add(this.createdGroupId!, teacher.id, this.dialogTeacherTypes[teacher.id] ?? GroupTeacherType.Main)
        );
        forkJoin(ops).subscribe({
            next: () => {
                this.assigning = false;
                this.createStep = 3;
            },
            error: () => {
                this.assigning = false;
            }
        });
    }

    assignStudents() {
        if (!this.createdGroupId) {
            this.createDialogVisible = false;
            return;
        }
        this.assigning = true;
        if (!this.dialogStudentsSelection.length) {
            this.assigning = false;
            this.createDialogVisible = false;
            this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.groups') }));
            this.loadGroups(this.meta().page, this.meta().perPage);
            return;
        }
        const ops = this.dialogStudentsSelection.map((student) =>
            this.groupStudentsService.add(this.createdGroupId!, student.id)
        );
        forkJoin(ops).subscribe({
            next: () => {
                this.assigning = false;
                this.createDialogVisible = false;
                this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.groups') }));
                this.loadGroups(this.meta().page, this.meta().perPage);
            },
            error: () => {
                this.assigning = false;
            }
        });
    }

    setGroupDialogTab(value: string | number | undefined | null) {
        if (!value) return;
        this.groupDialogTab = String(value);
    }

    get groupDialogTitle(): string {
        if (this.groupDialogViewOnly) {
            return this.translate.instant('pages.groups.details_title');
        }
        return this.translate.instant('common.edit_group');
    }

    viewGroup(group: CourseGroup) {
        this.groupDialogViewOnly = true;
        this.groupDialogTab = 'details';
        this.currentGroupId = String(group.id);
        this.currentGroupCourseName = group.courseName || group.course?.name || '-';
        this.editGroupName = group.name ?? '';
        this.memberTeachers = [];
        this.memberStudents = [];
        this.groupDialogVisible = true;
        this.loadGroupMembers();
    }

    editGroup(group: CourseGroup) {
        this.groupDialogViewOnly = false;
        this.groupDialogTab = 'details';
        this.currentGroupId = String(group.id);
        this.currentGroupCourseName = group.courseName || group.course?.name || '-';
        this.editGroupName = group.name ?? '';
        this.memberTeachers = [];
        this.memberStudents = [];
        this.editTeachersSelection = [];
        this.editStudentsSelection = [];
        this.editTeacherTypes = {};
        this.editFilteredTeachers = [];
        this.editFilteredStudents = [];
        this.groupDialogSubmitting = false;
        this.groupDialogVisible = true;
        this.loadTeachersAndStudents(() => this.loadGroupMembersForEdit());
    }

    closeGroupDialog() {
        this.groupDialogVisible = false;
        this.groupDialogViewOnly = false;
    }

    saveGroup() {
        if (!this.currentGroupId || this.groupDialogSubmitting) return;
        const name = this.editGroupName.trim();
        if (!name) return;
        this.groupDialogSubmitting = true;

        const nameUpdate = this.courseGroupsService.update(this.currentGroupId, { name });

        const teachersPayload = this.editTeachersSelection.map((t) => ({
            teacherId: t.id,
            type: this.editTeacherTypes[t.id] ?? GroupTeacherType.Main
        }));
        const teachersUpdate = this.groupTeachersService.assign(this.currentGroupId, teachersPayload);

        const studentIds = this.editStudentsSelection.map((s) => s.id);
        const studentsUpdate = this.groupStudentsService.assign(this.currentGroupId, studentIds);

        forkJoin({
            name: nameUpdate,
            teachers: teachersUpdate,
            students: studentsUpdate
        }).subscribe({
            next: () => {
                this.groupDialogSubmitting = false;
                this.groupDialogVisible = false;
                this.messageService.add({
                    severity: 'success',
                    summary: this.translate.instant('common.successful'),
                    detail: this.translate.instant('common.updated', { entity: this.translate.instant('entities.groups') }),
                    life: 3000
                });
                this.loadGroups(this.meta().page, this.meta().perPage);
            },
            error: () => {
                this.groupDialogSubmitting = false;
            }
        });
    }

    deleteGroup(group: CourseGroup) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: group.name }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.courseGroupsService.delete(group.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.groups') }),
                            life: 3000
                        });
                        this.loadGroups(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    private loadGroupMembers() {
        if (!this.currentGroupId || this.membersLoading) return;
        this.membersLoading = true;
        forkJoin({
            students: this.groupStudentsService.listByGroup(this.currentGroupId, 1, 100),
            teachers: this.groupTeachersService.listByGroup(this.currentGroupId, 1, 100)
        }).subscribe({
            next: (res) => {
                this.memberStudents = (res.students?.data ?? []).map((item) => ({
                    id: String(item.studentId ?? item.student?.id ?? ''),
                    name: `${item.student?.profile?.firstName ?? ''} ${item.student?.profile?.lastName ?? ''}`.trim()
                })).filter((s) => s.id);
                this.memberTeachers = (res.teachers?.data ?? []).map((item) => ({
                    id: String(item.teacherId ?? item.teacher?.id ?? ''),
                    name: `${item.teacher?.profile?.firstName ?? ''} ${item.teacher?.profile?.lastName ?? ''}`.trim(),
                    type: item.type ?? GroupTeacherType.Main
                })).filter((t) => t.id);
                this.membersLoading = false;
            },
            error: () => {
                this.membersLoading = false;
            }
        });
    }

    syncEditTeacherTypes(selection: Person[] | null | undefined) {
        const selected = selection ?? [];
        selected.forEach((teacher) => {
            if (!this.editTeacherTypes[teacher.id]) {
                this.editTeacherTypes[teacher.id] = GroupTeacherType.Main;
            }
        });
        const selectedIds = new Set(selected.map((t) => t.id));
        Object.keys(this.editTeacherTypes).forEach((id) => {
            if (!selectedIds.has(id)) {
                delete this.editTeacherTypes[id];
            }
        });
    }

    onEditMembersFilter(event: Event, type: 'teachers' | 'students') {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        if (type === 'teachers') {
            this.editFilteredTeachers = this.allTeachers.filter((t) => t.name.toLowerCase().includes(query));
        } else {
            this.editFilteredStudents = this.allStudents.filter((s) => s.name.toLowerCase().includes(query));
        }
    }

    private loadGroupMembersForEdit() {
        if (!this.currentGroupId || this.membersLoading) return;
        this.membersLoading = true;
        forkJoin({
            students: this.groupStudentsService.listByGroup(this.currentGroupId, 1, 100),
            teachers: this.groupTeachersService.listByGroup(this.currentGroupId, 1, 100)
        }).subscribe({
            next: (res) => {
                const fetchedStudents = (res.students?.data ?? []).map((item) => ({
                    id: String(item.studentId ?? item.student?.id ?? ''),
                    name: `${item.student?.profile?.firstName ?? ''} ${item.student?.profile?.lastName ?? ''}`.trim()
                })).filter((s) => s.id);

                const fetchedTeachers = (res.teachers?.data ?? []).map((item) => ({
                    id: String(item.teacherId ?? item.teacher?.id ?? ''),
                    name: `${item.teacher?.profile?.firstName ?? ''} ${item.teacher?.profile?.lastName ?? ''}`.trim(),
                    type: item.type ?? GroupTeacherType.Main
                })).filter((t) => t.id);

                this.memberStudents = fetchedStudents;
                this.memberTeachers = fetchedTeachers;

                this.editStudentsSelection = this.allTeachers.length
                    ? this.allStudents.filter((s) => fetchedStudents.some((fs) => fs.id === s.id))
                    : [];
                this.editTeachersSelection = this.allTeachers.length
                    ? this.allTeachers.filter((t) => fetchedTeachers.some((ft) => ft.id === t.id))
                    : [];
                this.editTeacherTypes = Object.fromEntries(
                    fetchedTeachers.map((t) => [t.id, t.type])
                );
                this.editFilteredTeachers = [...this.allTeachers];
                this.editFilteredStudents = [...this.allStudents];
                this.syncEditTeacherTypes(this.editTeachersSelection);

                this.membersLoading = false;
            },
            error: () => {
                this.membersLoading = false;
            }
        });
    }

    private loadTeachersAndStudents(callback?: () => void) {
        const teachers$ = this.teacherService.list(1, 100, TEACHER_ROLE_FILTER);
        const students$ = this.studentService.list(1, 100, STUDENT_ROLE_FILTER);
        forkJoin({ teachers: teachers$, students: students$ }).subscribe({
            next: (res) => {
                this.allTeachers = ((res.teachers?.data ?? []) as Teacher[]).map((teacher) => ({
                    id: String(teacher.id),
                    name: `${teacher.profile?.firstName ?? ''} ${teacher.profile?.lastName ?? ''}`.trim()
                }));
                this.allStudents = ((res.students?.data ?? []) as Student[]).map((student) => ({
                    id: String(student.id),
                    name: `${student.profile?.firstName ?? ''} ${student.profile?.lastName ?? ''}`.trim()
                }));
                this.dialogFilteredTeachers = [...this.allTeachers];
                this.dialogFilteredStudents = [...this.allStudents];
                this.editFilteredTeachers = [...this.allTeachers];
                this.editFilteredStudents = [...this.allStudents];
                callback?.();
            },
            error: () => {
                callback?.();
            }
        });
    }

    private loadCourses() {
        if (this.courseOptions.length) return;
        this.courseService.list(1, 100).subscribe({
            next: (res) => {
                this.courseOptions = (res?.data ?? []).map((c) => ({
                    label: c.name ?? '',
                    value: String(c.id ?? '')
                }));
            },
            error: () => {}
        });
    }

    private loadTeachers() {
        if (this.allTeachers.length) return;
        this.teacherService.list(1, 100, TEACHER_ROLE_FILTER).subscribe({
            next: (res) => {
                const data = (res?.data ?? []) as Teacher[];
                this.allTeachers = data.map((teacher) => ({
                    id: String(teacher.id),
                    name: `${teacher.profile?.firstName ?? ''} ${teacher.profile?.lastName ?? ''}`.trim()
                }));
                this.dialogFilteredTeachers = [...this.allTeachers];
            },
            error: () => {}
        });
    }

    private loadStudents() {
        if (this.allStudents.length) return;
        this.studentService.list(1, 100, STUDENT_ROLE_FILTER).subscribe({
            next: (res) => {
                const data = (res?.data ?? []) as Student[];
                this.allStudents = data.map((student) => ({
                    id: String(student.id),
                    name: `${student.profile?.firstName ?? ''} ${student.profile?.lastName ?? ''}`.trim()
                }));
                this.dialogFilteredStudents = [...this.allStudents];
            },
            error: () => {}
        });
    }

    private setTeacherTypeOptions() {
        this.teacherTypeOptions = Object.values(GroupTeacherType).map((value) => ({
            label: this.translate.instant(`enums.teacher_type.${value}`),
            value
        }));
    }

    private setColumns() {
        this.cols = [
            { field: 'name', header: this.translate.instant('fields.group_name') },
            { field: 'courseName', header: this.translate.instant('entities.course') },
            { field: 'teacherCount', header: this.translate.instant('entities.teachers') },
            { field: 'studentCount', header: this.translate.instant('entities.students') },
            { field: 'createdAt', header: this.translate.instant('fields.created_at') }
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }

    teacherTypeLabel(type?: GroupTeacherType): string {
        if (!type) return '-';
        return this.translate.instant(`enums.teacher_type.${type}`);
    }
}

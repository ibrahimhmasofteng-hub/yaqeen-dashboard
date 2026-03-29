import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';
import { CourseService } from '@/app/features/courses/services/course.service';
import { CourseSupervisorsService } from '@/app/features/courses/services/course-supervisors.service';
import { CourseType } from '@/app/features/courses/models/course-type.enum';
import { GroupTeacherType } from '@/app/features/courses/models/group-teacher-type.enum';
import { WeekDay } from '@/app/features/courses/models/week-day.enum';
import { CourseGroupsService } from '@/app/features/courses/services/course-groups.service';
import { GroupStudentsService } from '@/app/features/courses/services/group-students.service';
import { GroupTeachersService } from '@/app/features/courses/services/group-teachers.service';
import { SupervisorService } from '@/app/features/supervisors/services/supervisor.service';
import { Supervisor } from '@/app/features/supervisors/models/supervisor.model';
import { TeacherService } from '@/app/features/teachers/services/teacher.service';
import { Teacher } from '@/app/features/teachers/models/teacher.model';
import { RoleService } from '@/app/features/roles/services/role.service';
import { Role } from '@/app/features/roles/models/role.model';
import { RoleName } from '@/app/core/constants/role-name.enum';
import { NotificationService } from '@/app/core/services/notification.service';
import { StudentService } from '@/app/features/students/services/student.service';
import { Student } from '@/app/features/students/models/student.model';
import { forkJoin } from 'rxjs';

interface CourseTimeRow {
    day: WeekDay | null;
    startHour: number | null;
    endHour: number | null;
}

type EditSection = 'details' | 'times' | 'supervisors' | 'groups';

type MembersTab = 'teachers' | 'students';

interface Person {
    id: string;
    name: string;
}

interface Group {
    id: string;
    name: string;
    teachers: Array<Person & { type: GroupTeacherType }>;
    students: Person[];
    teacherCount?: number;
    studentCount?: number;
}

const SUPERVISOR_ROLE_FILTER = RoleName.Supervisor;
const TEACHER_ROLE_FILTER = RoleName.Teacher;
const STUDENT_ROLE_FILTER = RoleName.Student;

@Component({
    selector: 'app-courses-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        DialogModule,
        DrawerModule,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
        SelectModule,
        MultiSelectModule,
        StepperModule,
        TabsModule,
        TableModule,
        TranslateModule,
        FormErrors
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ isEditMode ? ('pages.courses.edit_title' | translate) : ('pages.courses.create_title' | translate) }}</h2>
                <p class="text-surface-500">{{ isEditMode ? ('pages.courses.edit_subtitle' | translate) : ('pages.courses.create_subtitle' | translate) }}</p>
            </div>
            <p-button *ngIf="viewOnly" [label]="'common.edit' | translate" icon="pi pi-pencil" severity="secondary" (onClick)="goToEdit()"></p-button>
        </div>

        <div class="card">
            <ng-container *ngIf="isEditMode; else createWizard">
                <p-tabs [value]="activeEditSection" (valueChange)="setEditSection($event)">
                    <p-tablist>
                        <p-tab value="details">{{ 'common.details' | translate }}</p-tab>
                        <p-tab value="times">{{ 'fields.times' | translate }}</p-tab>
                        <p-tab value="supervisors">{{ 'entities.supervisors' | translate }}</p-tab>
                        <p-tab value="groups">{{ 'entities.groups' | translate }}</p-tab>
                    </p-tablist>
                    <p-tabpanels>
                        <p-tabpanel value="details">
                            <ng-container *ngTemplateOutlet="detailsSection"></ng-container>
                        </p-tabpanel>
                        <p-tabpanel value="times">
                            <ng-container *ngTemplateOutlet="timesSection"></ng-container>
                        </p-tabpanel>
                        <p-tabpanel value="supervisors">
                            <ng-container *ngTemplateOutlet="supervisorsSection"></ng-container>
                        </p-tabpanel>
                        <p-tabpanel value="groups">
                            <ng-container *ngTemplateOutlet="groupsSection"></ng-container>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </ng-container>

            <ng-template #createWizard>
                <p-stepper [value]="activeStep">
                    <p-step-list>
                        <p-step [value]="1">{{ 'common.details' | translate }}</p-step>
                        <p-step [value]="2">{{ 'fields.times' | translate }}</p-step>
                        <p-step [value]="3" [disabled]="!courseCreatedId">{{ 'entities.supervisors' | translate }}</p-step>
                        <p-step [value]="4" [disabled]="!courseCreatedId">{{ 'entities.groups' | translate }}</p-step>
                    </p-step-list>
                    <p-step-panels>
                        <p-step-panel [value]="1">
                            <ng-template #content>
                                <ng-container *ngTemplateOutlet="detailsFields"></ng-container>
                                <div class="flex justify-end gap-2 mt-6">
                                    <p-button class="wizard-nav-btn" [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextFromDetails()" [disabled]="submitting"></p-button>
                                </div>
                            </ng-template>
                        </p-step-panel>
                        <p-step-panel [value]="2">
                            <ng-template #content>
                                <ng-container *ngTemplateOutlet="timesFields"></ng-container>
                                <div class="flex justify-between gap-2 mt-6">
                                    <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 1" [disabled]="submitting"></p-button>
                                    <p-button class="wizard-nav-btn" [label]="'common.save_course' | translate" icon="pi pi-check" (onClick)="saveCourseAndContinue()" [loading]="submitting" [disabled]="submitting"></p-button>
                                </div>
                            </ng-template>
                        </p-step-panel>
                        <p-step-panel [value]="3">
                            <ng-template #content>
                                <ng-container *ngTemplateOutlet="supervisorsFields"></ng-container>
                                <div class="flex justify-between gap-2 mt-6">
                                    <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 2" [disabled]="submitting"></p-button>
                                    <p-button class="wizard-nav-btn" [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="saveSupervisorsAndContinue()" [loading]="assigningSupervisors" [disabled]="assigningSupervisors"></p-button>
                                </div>
                            </ng-template>
                        </p-step-panel>
                        <p-step-panel [value]="4">
                            <ng-template #content>
                                <ng-container *ngTemplateOutlet="groupsSection"></ng-container>
                                <div class="flex justify-start gap-2 mt-6">
                                    <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 3" [disabled]="submitting"></p-button>
                                </div>
                            </ng-template>
                        </p-step-panel>
                    </p-step-panels>
                </p-stepper>
            </ng-template>
        </div>

        <ng-template #detailsSection>
            <form [formGroup]="courseForm">
                <ng-container *ngTemplateOutlet="detailsFields"></ng-container>
                <div class="flex justify-end gap-2 mt-6" *ngIf="!viewOnly">
                    <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="saveCourse()" [loading]="submitting" [disabled]="submitting"></p-button>
                </div>
            </form>
        </ng-template>

        <ng-template #detailsFields>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6" [formGroup]="courseForm">
                <div>
                    <label for="courseName" class="block font-bold mb-3">{{ 'fields.course_name' | translate }} <span class="text-red-500">*</span></label>
                    <input type="text" pInputText id="courseName" formControlName="name" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                    <app-form-errors [control]="courseForm.get('name')" [show]="submitted"></app-form-errors>
                </div>
                <div>
                    <label for="courseType" class="block font-bold mb-3">{{ 'fields.course_type' | translate }} <span class="text-red-500">*</span></label>
                    <p-select
                        id="courseType"
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
                    <label for="startDate" class="block font-bold mb-3">{{ 'fields.start_date' | translate }}</label>
                    <input type="date" pInputText id="startDate" formControlName="startDate" fluid [readonly]="viewOnly" [disabled]="submitting" />
                </div>
                <div>
                    <label for="endDate" class="block font-bold mb-3">{{ 'fields.end_date' | translate }}</label>
                    <input type="date" pInputText id="endDate" formControlName="endDate" fluid [readonly]="viewOnly" [disabled]="submitting" />
                </div>
                <div class="md:col-span-2">
                    <label for="note" class="block font-bold mb-3">{{ 'fields.note' | translate }}</label>
                    <input type="text" pInputText id="note" formControlName="note" fluid [readonly]="viewOnly" [disabled]="submitting" />
                </div>
            </div>
        </ng-template>

        <ng-template #timesSection>
            <ng-container *ngTemplateOutlet="timesFields"></ng-container>
            <div class="flex justify-end gap-2 mt-6" *ngIf="!viewOnly">
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="saveCourse()" [loading]="submitting" [disabled]="submitting"></p-button>
            </div>
        </ng-template>

        <ng-template #timesFields>
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h5 class="m-0">{{ 'fields.times' | translate }}</h5>
                    <p-button [label]="'common.add_time' | translate" icon="pi pi-plus" severity="secondary" (onClick)="addTimeRow()" [disabled]="submitting || viewOnly"></p-button>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" *ngFor="let row of courseTimes; let i = index">
                        <div>
                            <label class="block font-bold mb-2">{{ 'fields.day' | translate }}</label>
                            <p-select
                                [options]="weekDayOptions"
                                optionLabel="label"
                                optionValue="value"
                                [(ngModel)]="row.day"
                                [ngModelOptions]="{ standalone: true }"
                                appendTo="body"
                                [disabled]="submitting || viewOnly"
                                [placeholder]="'common.select_day' | translate"
                                fluid
                                styleClass="w-full"
                            />
                        </div>
                        <div>
                            <label class="block font-bold mb-2">{{ 'fields.start_hour' | translate }}</label>
                            <input type="number" min="0" max="23" pInputText class="w-full" [(ngModel)]="row.startHour" [ngModelOptions]="{ standalone: true }" [disabled]="submitting || viewOnly" />
                        </div>
                        <div>
                            <label class="block font-bold mb-2">{{ 'fields.end_hour' | translate }}</label>
                            <input type="number" min="0" max="23" pInputText class="w-full" [(ngModel)]="row.endHour" [ngModelOptions]="{ standalone: true }" [disabled]="submitting || viewOnly" />
                        </div>
                        <div class="flex items-end">
                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="removeTimeRow(i)" [disabled]="submitting || viewOnly || courseTimes.length === 1"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </ng-template>

        <ng-template #supervisorsSection>
            <ng-container *ngTemplateOutlet="supervisorsFields"></ng-container>
            <div class="flex justify-end gap-2 mt-6" *ngIf="!viewOnly">
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="assignSupervisors()" [loading]="assigningSupervisors" [disabled]="assigningSupervisors"></p-button>
            </div>
        </ng-template>

        <ng-template #supervisorsFields>
            <div class="flex items-center justify-between mb-4">
                <h5 class="m-0">{{ 'entities.supervisors' | translate }}</h5>
                <p-button [label]="'common.add_supervisor' | translate" icon="pi pi-plus" severity="secondary" (onClick)="openSupervisorDialog()" [disabled]="submitting || viewOnly"></p-button>
            </div>
            <p-multiSelect
                [options]="supervisors()"
                optionLabel="profile.firstName"
                optionValue="id"
                [(ngModel)]="selectedSupervisorIds"
                [ngModelOptions]="{ standalone: true }"
                [loading]="supervisorsLoading"
                [disabled]="assigningSupervisors || viewOnly"
                [placeholder]="'common.select_supervisors' | translate"
                [showClear]="true"
                display="chip"
                [maxSelectedLabels]="200"
                appendTo="body"
                styleClass="w-full"
            >
                <ng-template let-supervisor pTemplate="item">
                    <div class="flex items-center justify-between w-full">
                        <div class="flex flex-col">
                            <span class="font-medium">{{ supervisor?.profile?.firstName }} {{ supervisor?.profile?.lastName }}</span>
                            <span class="text-sm text-surface-500">{{ displayValue(supervisor?.email) }}</span>
                        </div>
                    </div>
                </ng-template>
                <ng-template let-supervisor pTemplate="selectedItem">
                    <div class="inline-flex items-center gap-2">
                        <span>{{ supervisor?.profile?.firstName }} {{ supervisor?.profile?.lastName }}</span>
                    </div>
                </ng-template>
            </p-multiSelect>
        </ng-template>

        <ng-template #groupsSection>
            <div class="flex items-center justify-between mb-4">
                <h5 class="m-0">{{ 'entities.groups' | translate }}</h5>
                <p-button [label]="'common.create_group' | translate" icon="pi pi-plus" severity="secondary" (onClick)="openCreateGroup()" [disabled]="viewOnly"></p-button>
            </div>
            <p-table [value]="groups" [tableStyle]="{ 'min-width': '60rem' }">
                <ng-template #header>
                    <tr>
                        <th style="min-width: 18rem">{{ 'fields.group_name' | translate }}</th>
                        <th style="min-width: 12rem">{{ 'entities.teachers' | translate }}</th>
                        <th style="min-width: 12rem">{{ 'entities.students' | translate }}</th>
                        <th style="min-width: 12rem">{{ 'common.actions' | translate }}</th>
                    </tr>
                </ng-template>
                <ng-template #body let-group>
                    <tr>
                        <td>{{ displayValue(group.name) }}</td>
                        <td>{{ displayValue(group.teacherCount ?? group.teachers.length) }}</td>
                        <td>{{ displayValue(group.studentCount ?? group.students.length) }}</td>
                        <td>
                            <p-button icon="pi pi-users" class="mr-2" [rounded]="true" [outlined]="true" (click)="openMembersDrawer(group)" />
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="openEditGroup(group)" [disabled]="true" />
                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="removeGroup(group)" [disabled]="viewOnly" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </ng-template>

        <p-dialog [(visible)]="supervisorDialog" [style]="{ width: '780px' }" [header]="'common.add_supervisor' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="supervisorForm">
                    <input type="hidden" formControlName="roleId" />
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        <div>
                            <label for="supervisorUsername" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="supervisorUsername" formControlName="username" required fluid [disabled]="supervisorSubmitting" />
                            <app-form-errors [control]="supervisorForm.get('username')" [show]="supervisorSubmitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="supervisorPassword" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                            <input type="password" pInputText id="supervisorPassword" formControlName="password" required fluid [disabled]="supervisorSubmitting" />
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
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="saveSupervisor()" [loading]="supervisorSubmitting" [disabled]="supervisorSubmitting" />
            </ng-template>
        </p-dialog>

        <p-drawer [(visible)]="groupDrawerVisible" position="right" [style]="{ width: '28rem' }" [modal]="true" [header]="groupDrawerTitle">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="groupName" class="block font-bold mb-3">{{ 'fields.group_name' | translate }}</label>
                    <input type="text" pInputText id="groupName" [(ngModel)]="groupName" [ngModelOptions]="{ standalone: true }" [disabled]="viewOnly || groupSubmitting" />
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="closeGroupDrawer()" />
                    <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="saveGroup()" [loading]="groupSubmitting" [disabled]="!groupName.trim() || viewOnly || groupSubmitting" />
                </div>
            </div>
        </p-drawer>

        <p-drawer [(visible)]="membersDrawerVisible" position="right" [style]="{ width: '48rem' }" [modal]="true" [header]="membersDrawerTitle">
            <p-tabs [value]="membersTab" (valueChange)="setMembersTab($event)">
                <p-tablist>
                    <p-tab value="teachers">{{ 'entities.teachers' | translate }}</p-tab>
                    <p-tab value="students">{{ 'entities.students' | translate }}</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel value="teachers">
                        <div class="flex items-center justify-between mb-4">
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [placeholder]="'common.search' | translate" (input)="onMembersFilter($event, 'teachers')" />
                            </p-iconfield>
                            <span class="text-sm text-surface-500">{{ membersTeachersSelection.length || 0 }} {{ 'entities.teachers' | translate }}</span>
                        </div>
                        <p-table
                            [value]="filteredTeachers"
                            dataKey="id"
                            selectionMode="multiple"
                            [(selection)]="membersTeachersSelection"
                            (selectionChange)="syncTeacherTypes($event)"
                            [loading]="groupMembersLoading"
                            [tableStyle]="{ 'min-width': '40rem' }"
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
                                            [(ngModel)]="teacherTypes[teacher.id]"
                                            [ngModelOptions]="{ standalone: true }"
                                            appendTo="body"
                                            [disabled]="!isTeacherSelected(teacher) || viewOnly || groupMembersSubmitting"
                                            [placeholder]="'common.select_type' | translate"
                                            styleClass="w-full"
                                        />
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                        <p class="mt-3 text-sm text-surface-500" *ngIf="!membersTeachersSelection.length">{{ 'common.no_teachers_selected' | translate }}</p>
                    </p-tabpanel>
                    <p-tabpanel value="students">
                        <div class="flex items-center justify-between mb-4">
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [placeholder]="'common.search' | translate" (input)="onMembersFilter($event, 'students')" />
                            </p-iconfield>
                            <span class="text-sm text-surface-500">{{ membersStudentsSelection.length || 0 }} {{ 'entities.students' | translate }}</span>
                        </div>
                        <p-table
                            [value]="filteredStudents"
                            dataKey="id"
                            selectionMode="multiple"
                            [(selection)]="membersStudentsSelection"
                            [loading]="groupMembersLoading"
                            [tableStyle]="{ 'min-width': '40rem' }"
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
                        <p class="mt-3 text-sm text-surface-500" *ngIf="!membersStudentsSelection.length">{{ 'common.no_students_selected' | translate }}</p>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
            <div class="flex justify-end gap-2 mt-4">
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="closeMembersDrawer()" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="applyMembers()" [loading]="groupMembersSubmitting" [disabled]="viewOnly || groupMembersSubmitting || groupMembersLoading" />
            </div>
        </p-drawer>
    `
})
export class CoursesForm implements OnInit {
    courseForm: FormGroup;
    supervisorForm: FormGroup;

    courseTimes: CourseTimeRow[] = [{ day: null, startHour: null, endHour: null }];
    courseTypeOptions: { label: string; value: CourseType }[] = [];
    weekDayOptions: { label: string; value: WeekDay }[] = [];

    activeStep = 1;
    activeEditSection: EditSection = 'details';

    viewOnly = false;
    isEditMode = false;
    submitted = false;

    courseCreatedId?: string;
    currentCourseId?: string;

    supervisors = signal<Supervisor[]>([]);
    roles = signal<Role[]>([]);
    supervisorsLoading = false;
    assigningSupervisors = false;
    selectedSupervisorIds: string[] = [];

    supervisorDialog = false;
    supervisorSubmitting = false;
    supervisorSubmitted = false;
    supervisorRoleId = '';

    groupDrawerVisible = false;
    membersDrawerVisible = false;
    groupName = '';
    editingGroupId?: string;
    activeGroup?: Group;
    membersTab: MembersTab = 'teachers';
    membersTeachersSelection: Person[] = [];
    membersStudentsSelection: Person[] = [];
    teacherTypes: Record<string, GroupTeacherType> = {};

    groups: Group[] = [];
    teachers: Person[] = [];
    students: Person[] = [];

    filteredTeachers: Person[] = [...this.teachers];
    filteredStudents: Person[] = [...this.students];
    teacherTypeOptions: { label: string; value: GroupTeacherType }[] = [];

    submitting = false;
    groupSubmitting = false;
    groupMembersSubmitting = false;
    groupMembersLoading = false;
    teachersLoading = false;
    studentsLoading = false;

    constructor(
        private courseService: CourseService,
        private courseSupervisorsService: CourseSupervisorsService,
        private courseGroupsService: CourseGroupsService,
        private groupStudentsService: GroupStudentsService,
        private groupTeachersService: GroupTeachersService,
        private supervisorService: SupervisorService,
        private teacherService: TeacherService,
        private studentService: StudentService,
        private roleService: RoleService,
        private notification: NotificationService,
        private translate: TranslateService,
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.courseForm = this.fb.group({
            name: ['', Validators.required],
            type: [null, Validators.required],
            startDate: [''],
            endDate: [''],
            note: ['']
        });

        this.supervisorForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
            password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            email: ['', Validators.email],
            phone: [''],
            roleId: [''],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.setCourseTypeOptions();
        this.setWeekDayOptions();
        this.loadRoles();
        this.loadSupervisors();
        this.loadTeachers();
        this.loadStudents();
        this.setTeacherTypeOptions();

        this.translate.onLangChange.subscribe(() => {
            this.setCourseTypeOptions();
            this.setWeekDayOptions();
            this.setTeacherTypeOptions();
        });

        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.currentCourseId = id;
                this.loadCourse(id);
                this.loadCourseSupervisors(id);
                this.loadGroups(id);
            }
        });

        this.route.queryParamMap.subscribe((params) => {
            this.viewOnly = params.get('view') === '1';
        });

        if (!this.isEditMode) {
            this.applyDefaultStartDate();
        }
    }

    setEditSection(value: string | number | undefined | null) {
        if (!value) return;
        this.activeEditSection = String(value) as EditSection;
    }

    goToEdit() {
        if (!this.currentCourseId) return;
        this.router.navigate(['/courses', this.currentCourseId, 'edit']);
    }

    nextFromDetails() {
        this.submitted = true;
        this.courseForm.get('name')?.markAsTouched();
        this.courseForm.get('type')?.markAsTouched();
        if (this.courseForm.get('name')?.valid && this.courseForm.get('type')?.valid) {
            this.activeStep = 2;
        }
    }

    saveCourseAndContinue() {
        this.saveCourse(true);
    }

    saveCourse(moveNext = false) {
        if (this.viewOnly) return;
        this.submitted = true;
        this.courseForm.get('name')?.markAsTouched();
        this.courseForm.get('type')?.markAsTouched();
        if (this.courseForm.invalid) return;

        const payload = this.buildCoursePayload();
        this.submitting = true;

        if (this.isEditMode && this.currentCourseId) {
            this.courseService.update(this.currentCourseId, payload).subscribe({
                next: () => {
                    this.submitting = false;
                    this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.courses') }));
                    if (moveNext) {
                        this.activeStep = 3;
                    }
                },
                error: () => {
                    this.submitting = false;
                }
            });
            return;
        }

        this.courseService.create(payload).subscribe({
            next: (res) => {
                this.submitting = false;
                const createdId = res?.id !== undefined && res?.id !== null ? String(res.id) : undefined;
                this.courseCreatedId = createdId;
                this.currentCourseId = createdId;
                this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.courses') }));
                if (moveNext) {
                    this.activeStep = 3;
                }
            },
            error: () => {
                this.submitting = false;
            }
        });
    }

    assignSupervisors() {
        if (this.viewOnly) return;
        const courseId = this.currentCourseId || this.courseCreatedId;
        if (!courseId) return;
        this.assigningSupervisors = true;
        this.courseSupervisorsService.assign(courseId, this.selectedSupervisorIds ?? []).subscribe({
            next: () => {
                this.assigningSupervisors = false;
                this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.supervisors') }));
            },
            error: () => {
                this.assigningSupervisors = false;
            }
        });
    }

    saveSupervisorsAndContinue() {
        if (!this.selectedSupervisorIds?.length) {
            this.activeStep = 4;
            return;
        }
        const courseId = this.currentCourseId || this.courseCreatedId;
        if (!courseId) return;
        this.assigningSupervisors = true;
        this.courseSupervisorsService.assign(courseId, this.selectedSupervisorIds ?? []).subscribe({
            next: () => {
                this.assigningSupervisors = false;
                this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.supervisors') }));
                this.activeStep = 4;
            },
            error: () => {
                this.assigningSupervisors = false;
            }
        });
    }

    openSupervisorDialog() {
        if (this.viewOnly) return;
        this.supervisorSubmitted = false;
        this.supervisorForm.reset({
            username: '',
            password: '',
            email: '',
            phone: '',
            roleId: this.supervisorRoleId || this.getSupervisorRoleId(),
            firstName: '',
            lastName: ''
        });
        this.supervisorDialog = true;
    }

    closeSupervisorDialog() {
        this.supervisorDialog = false;
    }

    saveSupervisor() {
        if (this.supervisorSubmitting) return;
        this.supervisorSubmitted = true;
        this.applySupervisorRoleId();
        if (this.supervisorForm.invalid) return;
        this.supervisorSubmitting = true;
        const formValue = this.supervisorForm.getRawValue();
        this.supervisorService
            .create({
                username: formValue.username,
                password: formValue.password,
                email: formValue.email,
                phone: formValue.phone,
                accountStatus: undefined,
                roleId: formValue.roleId,
                profile: {
                    firstName: formValue.firstName,
                    lastName: formValue.lastName
                }
            })
            .subscribe({
                next: () => {
                    this.supervisorSubmitting = false;
                    this.supervisorDialog = false;
                    this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.supervisors') }));
                    this.loadSupervisors();
                },
                error: () => {
                    this.supervisorSubmitting = false;
                }
            });
    }

    addTimeRow() {
        this.courseTimes = [...this.courseTimes, { day: null, startHour: null, endHour: null }];
    }

    removeTimeRow(index: number) {
        if (this.courseTimes.length <= 1) return;
        this.courseTimes = this.courseTimes.filter((_, i) => i !== index);
    }

    openCreateGroup() {
        if (this.viewOnly) return;
        this.groupName = '';
        this.editingGroupId = undefined;
        this.groupDrawerVisible = true;
    }

    openEditGroup(group: Group) {
        if (this.viewOnly) return;
        this.groupName = group.name;
        this.editingGroupId = group.id;
        this.groupDrawerVisible = true;
    }

    closeGroupDrawer() {
        this.groupDrawerVisible = false;
    }

    saveGroup() {
        const name = this.groupName.trim();
        if (!name || this.groupSubmitting) return;
        const courseId = this.currentCourseId || this.courseCreatedId;
        if (!courseId) return;
        this.groupSubmitting = true;
        this.courseGroupsService.create({ name, courseId }).subscribe({
            next: (created) => {
                this.groups = [
                    ...this.groups,
                    {
                        id: String(created.id),
                        name: created.name,
                        teachers: [],
                        students: [],
                        teacherCount: created.teacherCount ?? 0,
                        studentCount: created.studentCount ?? 0
                    }
                ];
                this.groupSubmitting = false;
                this.groupDrawerVisible = false;
                this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.groups') }));
            },
            error: () => {
                this.groupSubmitting = false;
            }
        });
    }

    removeGroup(group: Group) {
        if (this.viewOnly) return;
        this.groups = this.groups.filter((item) => item.id !== group.id);
        if (this.activeGroup?.id === group.id) {
            this.activeGroup = undefined;
        }
    }

    openMembersDrawer(group: Group) {
        this.activeGroup = group;
        this.membersTab = 'teachers';
        this.membersDrawerVisible = true;
        this.fetchGroupMembers(group.id);
    }

    closeMembersDrawer() {
        this.membersDrawerVisible = false;
    }

    private fetchGroupMembers(groupId: string) {
        if (this.groupMembersLoading) return;
        this.groupMembersLoading = true;
        forkJoin({
            students: this.groupStudentsService.listByGroup(groupId, 1, 100),
            teachers: this.groupTeachersService.listByGroup(groupId, 1, 100)
        }).subscribe({
            next: (res) => {
                const students = (res.students?.data ?? []).map((item) => ({
                    id: String(item.studentId ?? item.student?.id ?? ''),
                    name: `${item.student?.profile?.firstName ?? ''} ${item.student?.profile?.lastName ?? ''}`.trim()
                }));
                const teachers = (res.teachers?.data ?? []).map((item) => ({
                    id: String(item.teacherId ?? item.teacher?.id ?? ''),
                    name: `${item.teacher?.profile?.firstName ?? ''} ${item.teacher?.profile?.lastName ?? ''}`.trim(),
                    type: item.type ?? GroupTeacherType.Main
                }));

                this.groups = this.groups.map((group) =>
                    group.id === groupId
                        ? {
                              ...group,
                              students: students.filter((student) => student.id),
                              teachers: teachers.filter((teacher) => teacher.id)
                          }
                        : group
                );

                this.membersTeachersSelection = this.teachers.filter((teacher) =>
                    teachers.some((member) => member.id === teacher.id)
                );
                this.teacherTypes = Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher.type]));
                this.membersStudentsSelection = this.students.filter((student) =>
                    students.some((member) => member.id === student.id)
                );
                this.filteredTeachers = [...this.teachers];
                this.filteredStudents = [...this.students];
                this.syncTeacherTypes(this.membersTeachersSelection);
                this.groupMembersLoading = false;
            },
            error: () => {
                this.groupMembersLoading = false;
            }
        });
    }

    applyMembers() {
        if (!this.activeGroup || this.viewOnly || this.groupMembersSubmitting) {
            this.membersDrawerVisible = false;
            return;
        }
        const groupId = this.activeGroup.id;
        this.groupMembersSubmitting = true;
        if (this.membersTab === 'students') {
            if (this.haveSameIds(this.activeGroup.students, this.membersStudentsSelection)) {
                this.groupMembersSubmitting = false;
                return;
            }
            this.groupStudentsService.assign(groupId, this.membersStudentsSelection.map((student) => student.id)).subscribe({
                next: () => {
                    this.groups = this.groups.map((group) =>
                        group.id === this.activeGroup?.id
                            ? {
                                  ...group,
                                  students: [...this.membersStudentsSelection],
                                  studentCount: this.membersStudentsSelection.length
                              }
                            : group
                    );
                    this.groupMembersSubmitting = false;
                    this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.groups') }));
                },
                error: () => {
                    this.groupMembersSubmitting = false;
                }
            });
            return;
        }

        if (this.haveSameIds(this.activeGroup.teachers, this.membersTeachersSelection)) {
            this.groupMembersSubmitting = false;
            return;
        }
        const teachersPayload = this.membersTeachersSelection.map((teacher) => ({
            teacherId: teacher.id,
            type: this.teacherTypes[teacher.id] ?? GroupTeacherType.Main
        }));
        this.groupTeachersService.assign(groupId, teachersPayload).subscribe({
            next: () => {
                this.groups = this.groups.map((group) =>
                    group.id === this.activeGroup?.id
                        ? {
                              ...group,
                              teachers: this.membersTeachersSelection.map((teacher) => ({
                                  ...teacher,
                                  type: this.teacherTypes[teacher.id] ?? GroupTeacherType.Main
                              })),
                              teacherCount: this.membersTeachersSelection.length
                          }
                        : group
                );
                this.groupMembersSubmitting = false;
                this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.groups') }));
            },
            error: () => {
                this.groupMembersSubmitting = false;
            }
        });
    }

    setMembersTab(value: string | number | undefined | null) {
        if (!value) return;
        this.membersTab = String(value) as MembersTab;
    }

    onMembersFilter(event: Event, type: MembersTab) {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        if (type === 'teachers') {
            this.filteredTeachers = this.teachers.filter((teacher) => teacher.name.toLowerCase().includes(query));
        } else {
            this.filteredStudents = this.students.filter((student) => student.name.toLowerCase().includes(query));
        }
    }

    syncTeacherTypes(selection: Person[] | null | undefined) {
        const selected = selection ?? [];
        selected.forEach((teacher) => {
            if (!this.teacherTypes[teacher.id]) {
                this.teacherTypes[teacher.id] = GroupTeacherType.Main;
            }
        });
        const selectedIds = new Set(selected.map((teacher) => teacher.id));
        Object.keys(this.teacherTypes).forEach((id) => {
            if (!selectedIds.has(id)) {
                delete this.teacherTypes[id];
            }
        });
    }

    isTeacherSelected(teacher: Person): boolean {
        return this.membersTeachersSelection.some((item) => item.id === teacher.id);
    }

    private haveSameIds(listA: Person[], listB: Person[]): boolean {
        if (listA.length !== listB.length) return false;
        const ids = new Set(listA.map((item) => item.id));
        return listB.every((item) => ids.has(item.id));
    }

    get groupDrawerTitle(): string {
        return this.editingGroupId ? this.translate.instant('common.edit_group') : this.translate.instant('common.create_group');
    }

    get membersDrawerTitle(): string {
        const groupName = this.activeGroup?.name ? ` - ${this.activeGroup?.name}` : '';
        return `${this.translate.instant('common.manage_members')}${groupName}`;
    }

    private loadCourse(id: string | number) {
        this.courseService.get(id).subscribe({
            next: (res) => {
                this.courseForm.patchValue({
                    name: res?.name ?? '',
                    type: res?.type ?? null,
                    startDate: this.formatDateInput(res?.startDate),
                    endDate: this.formatDateInput(res?.endDate),
                    note: res?.note ?? ''
                });
                this.courseTimes = (res?.times ?? []).length
                    ? (res?.times ?? []).map((time) => ({
                          day: time.day ?? null,
                          startHour: time.startHour ?? null,
                          endHour: time.endHour ?? null
                      }))
                    : [{ day: null, startHour: null, endHour: null }];
                if (res?.id !== undefined && res?.id !== null) {
                    this.currentCourseId = String(res.id);
                    this.loadGroups(this.currentCourseId);
                }
            },
            error: () => {}
        });
    }

    private loadCourseSupervisors(courseId: string | number) {
        this.courseSupervisorsService.listByCourse(courseId, 1, 100).subscribe({
            next: (res) => {
                this.selectedSupervisorIds = (res?.data ?? [])
                    .map((assignment) => assignment.actorId)
                    .filter((value): value is string => !!value);
            },
            error: () => {}
        });
    }

    private loadRoles() {
        this.roleService.list(1, 100).subscribe({
            next: (res) => {
                this.roles.set(res?.data ?? []);
                this.supervisorRoleId = this.getSupervisorRoleId();
                this.applySupervisorRoleId();
            },
            error: () => {}
        });
    }

    private loadGroups(courseId: string | number) {
        this.courseGroupsService.listByCourse(courseId, 1, 100).subscribe({
            next: (res) => {
                this.groups = (res?.data ?? []).map((group) => ({
                    id: String(group.id),
                    name: group.name,
                    teachers: [],
                    students: [],
                    teacherCount: group.teacherCount,
                    studentCount: group.studentCount
                }));
            },
            error: () => {}
        });
    }

    private loadSupervisors() {
        if (this.supervisorsLoading) return;
        this.supervisorsLoading = true;
        this.supervisorService.list(1, 100, SUPERVISOR_ROLE_FILTER).subscribe({
            next: (res) => {
                this.supervisors.set(res?.data ?? []);
                this.supervisorsLoading = false;
            },
            error: () => {
                this.supervisorsLoading = false;
            }
        });
    }

    private loadTeachers() {
        if (this.teachersLoading) return;
        this.teachersLoading = true;
        this.teacherService.list(1, 100, TEACHER_ROLE_FILTER).subscribe({
            next: (res) => {
                const data = (res?.data ?? []) as Teacher[];
                this.teachers = data.map((teacher) => ({
                    id: String(teacher.id),
                    name: `${teacher.profile?.firstName ?? ''} ${teacher.profile?.lastName ?? ''}`.trim()
                }));
                this.filteredTeachers = [...this.teachers];
                this.teachersLoading = false;
            },
            error: () => {
                this.teachersLoading = false;
            }
        });
    }

    private loadStudents() {
        if (this.studentsLoading) return;
        this.studentsLoading = true;
        this.studentService.list(1, 100, STUDENT_ROLE_FILTER).subscribe({
            next: (res) => {
                const data = (res?.data ?? []) as Student[];
                this.students = data.map((student) => ({
                    id: String(student.id),
                    name: `${student.profile?.firstName ?? ''} ${student.profile?.lastName ?? ''}`.trim()
                }));
                this.filteredStudents = [...this.students];
                this.studentsLoading = false;
            },
            error: () => {
                this.studentsLoading = false;
            }
        });
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

    private setTeacherTypeOptions() {
        this.teacherTypeOptions = Object.values(GroupTeacherType).map((value) => ({
            label: this.translate.instant(`enums.teacher_type.${value}`),
            value
        }));
    }

    private buildCoursePayload() {
        const formValue = this.courseForm.getRawValue();
        return {
            name: formValue.name,
            type: formValue.type,
            startDate: this.toIsoDate(formValue.startDate),
            endDate: this.toIsoDate(formValue.endDate),
            note: formValue.note,
            times: this.courseTimes
                .filter((row) => row.day && row.startHour !== null && row.endHour !== null)
                .map((row) => ({
                    day: row.day as WeekDay,
                    startHour: Number(row.startHour),
                    endHour: Number(row.endHour)
                }))
        };
    }

    private toIsoDate(value: string | null | undefined): string {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toISOString();
    }

    private formatDateInput(value?: string | null): string {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString().slice(0, 10);
    }

    private applyDefaultStartDate() {
        if (this.courseForm.get('startDate')?.value) return;
        const today = new Date();
        const dateValue = today.toISOString().slice(0, 10);
        this.courseForm.get('startDate')?.setValue(dateValue);
    }

    private getSupervisorRoleId(): string {
        const role = this.roles().find((item) => item.name === SUPERVISOR_ROLE_FILTER);
        return role?.id !== undefined && role?.id !== null ? String(role.id) : '';
    }

    private applySupervisorRoleId() {
        const roleId = this.supervisorRoleId || this.getSupervisorRoleId();
        const control = this.supervisorForm.get('roleId');
        if (roleId && !control?.value) {
            control?.setValue(roleId);
        }
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }
}

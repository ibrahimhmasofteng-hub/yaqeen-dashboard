
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StudentService } from '@/app/features/students/services/student.service';
import { Student, StudentsMeta } from '@/app/features/students/models/student.model';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';
import { RoleService } from '@/app/features/roles/services/role.service';
import { Role } from '@/app/features/roles/models/role.model';
import { FamilyRelationService } from '@/app/features/students/services/family-relation.service';
import { RelationType } from '@/app/features/students/models/relation-type.enum';
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

const STUDENT_ROLE_FILTER = RoleName.Student;

@Component({
    selector: 'app-students-crud',
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
        StepperModule,
        PasswordModule,
        FormErrors,
        TranslateModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelectedStudents()" [disabled]="!selectedStudents || !selectedStudents.length" />
            </ng-template>

            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="students()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['username', 'email', 'phone', 'accountStatus']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedStudents"
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
                    <h5 class="m-0">{{ 'pages.students.manage_title' | translate }}</h5>
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
                    <th pSortableColumn="username" style="min-width:16rem">
                        {{ 'fields.username' | translate }}
                        <p-sortIcon field="username" />
                    </th>
                    <th pSortableColumn="email" style="min-width: 18rem">
                        {{ 'fields.email' | translate }}
                        <p-sortIcon field="email" />
                    </th>
                    <th pSortableColumn="phone" style="min-width: 14rem">
                        {{ 'fields.phone' | translate }}
                        <p-sortIcon field="phone" />
                    </th>
                    <th pSortableColumn="accountStatus" style="min-width: 10rem">
                        {{ 'fields.account_status' | translate }}
                        <p-sortIcon field="accountStatus" />
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-student>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="student" />
                    </td>
                    <td style="min-width: 16rem">{{ displayValue(student.username) }}</td>
                    <td style="min-width: 18rem">{{ displayValue(student.email) }}</td>
                    <td style="min-width: 14rem">{{ displayValue(student.phone) }}</td>
                    <td style="min-width: 10rem">{{ accountStatusLabel(student.accountStatus) }}</td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewStudent(student)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editStudent(student)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteStudent(student)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="studentDialog" [style]="{ width: '780px' }" [header]="'pages.students.details_title' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="studentForm">
                    <p-stepper [value]="activeStep">
                        <p-step-list>
                            <p-step [value]="1">{{ 'wizard.account' | translate }}</p-step>
                            <p-step [value]="2">{{ 'wizard.profile' | translate }}</p-step>
                            <p-step [value]="3">{{ 'wizard.additional' | translate }}</p-step>
                            <p-step [value]="4" [disabled]="!studentCreatedId">{{ 'wizard.guardian_1' | translate }}</p-step>
                            <p-step [value]="5" [disabled]="!studentCreatedId">{{ 'wizard.guardian_2' | translate }}</p-step>
                        </p-step-list>
                        <p-step-panels>
                            <p-step-panel [value]="1">
                                <ng-template #content>
                                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label for="username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="username" formControlName="username" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="studentForm.get('username')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                                            <p-password id="password" formControlName="password" [toggleMask]="true" [feedback]="false" [fluid]="true" [disabled]="submitting || viewOnly"></p-password>
                                            <app-form-errors [control]="studentForm.get('password')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="email" class="block font-bold mb-3">{{ 'fields.email' | translate }}</label>
                                            <input type="text" pInputText id="email" formControlName="email" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="studentForm.get('email')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="phone" class="block font-bold mb-3">{{ 'fields.phone' | translate }}</label>
                                            <input type="text" pInputText id="phone" formControlName="phone" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="accountStatus" class="block font-bold mb-3">{{ 'fields.account_status' | translate }}</label>
                                            <p-select
                                                id="accountStatus"
                                                [options]="accountStatusOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                formControlName="accountStatus"
                                                appendTo="body"
                                                [disabled]="submitting || viewOnly"
                                                [placeholder]="'common.select_status' | translate"
                                                fluid
                                            />
                                        </div>
                                        <input type="hidden" formControlName="roleId" />
                                    </div>
                                    <div class="flex justify-end gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextFromStep1()" [disabled]="submitting"></p-button>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="2">
                                <ng-template #content>
                                    <div formGroupName="profile" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label for="firstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="firstName" formControlName="firstName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="studentForm.get('profile.firstName')" [show]="step2Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="lastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="lastName" formControlName="lastName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="studentForm.get('profile.lastName')" [show]="step2Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="midName" class="block font-bold mb-3">{{ 'fields.mid_name' | translate }}</label>
                                            <input type="text" pInputText id="midName" formControlName="midName" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="additionalName" class="block font-bold mb-3">{{ 'fields.additional_name' | translate }}</label>
                                            <input type="text" pInputText id="additionalName" formControlName="additionalName" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="birthDate" class="block font-bold mb-3">{{ 'fields.birth_date' | translate }}</label>
                                            <input type="date" pInputText id="birthDate" formControlName="birthDate" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="birthPlace" class="block font-bold mb-3">{{ 'fields.birth_place' | translate }}</label>
                                            <input type="text" pInputText id="birthPlace" formControlName="birthPlace" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="nationalId" class="block font-bold mb-3">{{ 'fields.national_id' | translate }}</label>
                                            <input type="text" pInputText id="nationalId" formControlName="nationalId" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="imageId" class="block font-bold mb-3">{{ 'fields.image_id' | translate }}</label>
                                            <input type="text" pInputText id="imageId" formControlName="imageId" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                    </div>
                                    <div class="flex justify-between gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 1" [disabled]="submitting"></p-button>
                                        <p-button class="wizard-nav-btn" [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextFromStep2()" [disabled]="submitting"></p-button>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="3">
                                <ng-template #content>
                                    <div formGroupName="profile" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label for="job" class="block font-bold mb-3">{{ 'fields.job' | translate }}</label>
                                            <input type="text" pInputText id="job" formControlName="job" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="education" class="block font-bold mb-3">{{ 'fields.education' | translate }}</label>
                                            <input type="text" pInputText id="education" formControlName="education" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="address" class="block font-bold mb-3">{{ 'fields.address' | translate }}</label>
                                            <input type="text" pInputText id="address" formControlName="address" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="distinguishingSigns" class="block font-bold mb-3">{{ 'fields.distinguishing_signs' | translate }}</label>
                                            <input type="text" pInputText id="distinguishingSigns" formControlName="distinguishingSigns" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                        <div>
                                            <label for="note" class="block font-bold mb-3">{{ 'fields.note' | translate }}</label>
                                            <input type="text" pInputText id="note" formControlName="note" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                        </div>
                                    </div>
                                    <div class="flex justify-between gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 2" [disabled]="submitting"></p-button>
                                        <p-button [label]="'common.save_student' | translate" icon="pi pi-check" (onClick)="saveStudent()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting"></p-button>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="4">
                                <ng-template #content>
                                    <div [formGroup]="guardianForm1">
                                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                            <div>
                                                <label for="guardian1FirstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian1FirstName" formControlName="firstName" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm1.get('firstName')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian1LastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian1LastName" formControlName="lastName" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm1.get('lastName')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian1Phone" class="block font-bold mb-3">{{ 'fields.phone' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian1Phone" formControlName="phone" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm1.get('phone')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian1RoleId" class="block font-bold mb-3">{{ 'fields.role' | translate }} <span class="text-red-500">*</span></label>
                                                <p-select
                                                    id="guardian1RoleId"
                                                    [options]="roles()"
                                                    optionLabel="name"
                                                    optionValue="id"
                                                    formControlName="roleId"
                                                    appendTo="body"
                                                    [disabled]="submitting || viewOnly"
                                                    [placeholder]="'common.select_role' | translate"
                                                    fluid
                                                />
                                                <app-form-errors [control]="guardianForm1.get('roleId')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian1Username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian1Username" formControlName="username" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm1.get('username')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian1Password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                                                <p-password id="guardian1Password" formControlName="password" [toggleMask]="true" [feedback]="false" [fluid]="true" [disabled]="submitting || viewOnly"></p-password>
                                                <app-form-errors [control]="guardianForm1.get('password')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian1RelationType" class="block font-bold mb-3">{{ 'fields.relation_type' | translate }} <span class="text-red-500">*</span></label>
                                                <p-select
                                                    id="guardian1RelationType"
                                                    [options]="relationTypeOptions"
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    formControlName="relationType"
                                                    appendTo="body"
                                                    [disabled]="submitting || viewOnly"
                                                    [placeholder]="'common.select_relation' | translate"
                                                    fluid
                                                />
                                                <app-form-errors [control]="guardianForm1.get('relationType')" [show]="guardian1Submitted"></app-form-errors>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex justify-between gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 3" [disabled]="submitting"></p-button>
                                        <div class="flex gap-2">
                                            <p-button class="wizard-nav-btn" [label]="'common.skip' | translate" text (onClick)="finishGuardianFlow()" [disabled]="submitting"></p-button>
                                            <p-button [label]="'common.save_guardian' | translate" icon="pi pi-check" (onClick)="saveGuardian1()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting"></p-button>
                                        </div>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="5">
                                <ng-template #content>
                                    <div [formGroup]="guardianForm2">
                                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                            <div>
                                                <label for="guardian2FirstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian2FirstName" formControlName="firstName" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm2.get('firstName')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian2LastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian2LastName" formControlName="lastName" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm2.get('lastName')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian2Phone" class="block font-bold mb-3">{{ 'fields.phone' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian2Phone" formControlName="phone" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm2.get('phone')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian2RoleId" class="block font-bold mb-3">{{ 'fields.role' | translate }} <span class="text-red-500">*</span></label>
                                                <p-select
                                                    id="guardian2RoleId"
                                                    [options]="roles()"
                                                    optionLabel="name"
                                                    optionValue="id"
                                                    formControlName="roleId"
                                                    appendTo="body"
                                                    [disabled]="submitting || viewOnly"
                                                    [placeholder]="'common.select_role' | translate"
                                                    fluid
                                                />
                                                <app-form-errors [control]="guardianForm2.get('roleId')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian2Username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                                                <input type="text" pInputText id="guardian2Username" formControlName="username" required fluid [disabled]="submitting || viewOnly" />
                                                <app-form-errors [control]="guardianForm2.get('username')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian2Password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                                                <p-password id="guardian2Password" formControlName="password" [toggleMask]="true" [feedback]="false" [fluid]="true" [disabled]="submitting || viewOnly"></p-password>
                                                <app-form-errors [control]="guardianForm2.get('password')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                            <div>
                                                <label for="guardian2RelationType" class="block font-bold mb-3">{{ 'fields.relation_type' | translate }} <span class="text-red-500">*</span></label>
                                                <p-select
                                                    id="guardian2RelationType"
                                                    [options]="relationTypeOptions"
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    formControlName="relationType"
                                                    appendTo="body"
                                                    [disabled]="submitting || viewOnly"
                                                    [placeholder]="'common.select_relation' | translate"
                                                    fluid
                                                />
                                                <app-form-errors [control]="guardianForm2.get('relationType')" [show]="guardian2Submitted"></app-form-errors>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex justify-between gap-2 mt-6">
                                        <p-button class="wizard-nav-btn" [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 4" [disabled]="submitting"></p-button>
                                        <div class="flex gap-2">
                                            <p-button class="wizard-nav-btn" [label]="'common.skip' | translate" text (onClick)="finishGuardianFlow()" [disabled]="submitting"></p-button>
                                            <p-button [label]="'common.save_guardian' | translate" icon="pi pi-check" (onClick)="saveGuardian2()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting"></p-button>
                                        </div>
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
    `,
    providers: [MessageService, ConfirmationService]
})
export class StudentsCrud implements OnInit {
    studentDialog: boolean = false;
    viewOnly: boolean = false;

    students = signal<Student[]>([]);
    meta = signal<StudentsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    roles = signal<Role[]>([]);

    studentForm: FormGroup;
    guardianForm1: FormGroup;
    guardianForm2: FormGroup;
    currentStudentId?: string;
    studentCreatedId?: string;

    selectedStudents!: Student[] | null;

    loading: boolean = false;
    rolesLoading: boolean = false;
    submitting: boolean = false;

    activeStep = 1;
    step1Submitted = false;
    step2Submitted = false;
    guardian1Submitted = false;
    guardian2Submitted = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];
    accountStatusOptions: { label: string; value: AccountStatus }[] = [];
    relationTypeOptions: { label: string; value: RelationType }[] = [];

    constructor(
        private studentService: StudentService,
        private familyRelationService: FamilyRelationService,
        private roleService: RoleService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.studentForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
            password: [''],
            email: ['', Validators.email],
            phone: [''],
            accountStatus: [''],
            roleId: ['', Validators.required],
            profile: this.fb.group({
                firstName: ['', Validators.required],
                lastName: ['', Validators.required],
                midName: [''],
                additionalName: [''],
                birthDate: [''],
                birthPlace: [''],
                nationalId: [''],
                imageId: [''],
                job: [''],
                education: [''],
                address: [''],
                distinguishingSigns: [''],
                note: ['']
            })
        });

        this.guardianForm1 = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: ['', Validators.required],
            roleId: ['', Validators.required],
            username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
            password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            relationType: [null, Validators.required]
        });

        this.guardianForm2 = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: ['', Validators.required],
            roleId: ['', Validators.required],
            username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
            password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            relationType: [null, Validators.required]
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadStudents(1, 10);
        this.loadRoles();

        this.setColumns();
        this.setAccountStatusOptions();
        this.setRelationOptions();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
            this.setAccountStatusOptions();
            this.setRelationOptions();
        });
    }

    loadStudents(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.studentService.list(page, perPage, STUDENT_ROLE_FILTER).subscribe({
            next: (res) => {
                this.students.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadRoles() {
        if (this.rolesLoading) return;
        this.rolesLoading = true;
        this.roleService.list(1, 100).subscribe({
            next: (res) => {
                this.roles.set(res?.data ?? []);
                this.applyRoleId();
                this.rolesLoading = false;
            },
            error: () => {
                this.rolesLoading = false;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.viewOnly = false;
        this.currentStudentId = undefined;
        this.studentCreatedId = undefined;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.guardian1Submitted = false;
        this.guardian2Submitted = false;
        this.activeStep = 1;
        this.studentForm.reset({
            username: '',
            password: '',
            email: '',
            phone: '',
            accountStatus: '',
            roleId: this.getRoleId(),
            profile: {
                firstName: '',
                lastName: '',
                midName: '',
                additionalName: '',
                birthDate: '',
                birthPlace: '',
                nationalId: '',
                imageId: '',
                job: '',
                education: '',
                address: '',
                distinguishingSigns: '',
                note: ''
            }
        });
        this.guardianForm1.reset({
            firstName: '',
            lastName: '',
            phone: '',
            roleId: '',
            username: '',
            password: '',
            relationType: null
        });
        this.guardianForm2.reset({
            firstName: '',
            lastName: '',
            phone: '',
            roleId: '',
            username: '',
            password: '',
            relationType: null
        });
        const passwordControl = this.studentForm.get('password');
        passwordControl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(20)]);
        passwordControl?.updateValueAndValidity();
        const roleControl = this.studentForm.get('roleId');
        roleControl?.setValidators([Validators.required]);
        roleControl?.updateValueAndValidity();
        this.studentForm.enable();
        this.guardianForm1.enable();
        this.guardianForm2.enable();
        this.applyRoleId();
        this.studentDialog = true;
    }

    editStudent(student: Student) {
        this.viewOnly = false;
        this.activeStep = 1;
        this.studentDialog = true;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.guardian1Submitted = false;
        this.guardian2Submitted = false;
        this.studentCreatedId = student.id;
        this.studentService.get(student.id).subscribe((data) => {
            this.currentStudentId = data.id;
            this.studentForm.reset({
                username: data.username ?? '',
                password: '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                accountStatus: data.accountStatus ?? '',
                roleId: data.roleId ?? '',
                profile: {
                    firstName: data.profile?.firstName ?? '',
                    lastName: data.profile?.lastName ?? '',
                    midName: data.profile?.midName ?? '',
                    additionalName: data.profile?.additionalName ?? '',
                    birthDate: data.profile?.birthDate ?? '',
                    birthPlace: data.profile?.birthPlace ?? '',
                    nationalId: data.profile?.nationalId ?? '',
                    imageId: data.profile?.imageId ?? '',
                    job: data.profile?.job ?? '',
                    education: data.profile?.education ?? '',
                    address: data.profile?.address ?? '',
                    distinguishingSigns: data.profile?.distinguishingSigns ?? '',
                    note: data.profile?.note ?? ''
                }
            });
            const passwordControl = this.studentForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            const roleControl = this.studentForm.get('roleId');
            roleControl?.clearValidators();
            roleControl?.updateValueAndValidity();
            this.studentForm.enable();
        });
    }

    viewStudent(student: Student) {
        this.viewOnly = true;
        this.activeStep = 1;
        this.studentDialog = true;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.guardian1Submitted = false;
        this.guardian2Submitted = false;
        this.studentCreatedId = student.id;
        this.studentService.get(student.id).subscribe((data) => {
            this.currentStudentId = data.id;
            this.studentForm.reset({
                username: data.username ?? '',
                password: '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                accountStatus: data.accountStatus ?? '',
                roleId: data.roleId ?? '',
                profile: {
                    firstName: data.profile?.firstName ?? '',
                    lastName: data.profile?.lastName ?? '',
                    midName: data.profile?.midName ?? '',
                    additionalName: data.profile?.additionalName ?? '',
                    birthDate: data.profile?.birthDate ?? '',
                    birthPlace: data.profile?.birthPlace ?? '',
                    nationalId: data.profile?.nationalId ?? '',
                    imageId: data.profile?.imageId ?? '',
                    job: data.profile?.job ?? '',
                    education: data.profile?.education ?? '',
                    address: data.profile?.address ?? '',
                    distinguishingSigns: data.profile?.distinguishingSigns ?? '',
                    note: data.profile?.note ?? ''
                }
            });
            const passwordControl = this.studentForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.studentForm.disable();
            this.guardianForm1.disable();
            this.guardianForm2.disable();
        });
    }

    deleteSelectedStudents() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', {
                entity: this.translate.instant('entities.students')
            }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedStudents ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((s) => {
                    this.studentService.delete(s.id).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: this.translate.instant('common.successful'),
                                    detail: this.translate.instant('common.deleted_many', {
                                        entity: this.translate.instant('entities.students')
                                    }),
                                    life: 3000
                                });
                                this.selectedStudents = null;
                                this.loadStudents(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    deleteStudent(student: Student) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: student.username }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.studentService.delete(student.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.student') }),
                            life: 3000
                        });
                        this.loadStudents(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    saveStudent() {
        this.step1Submitted = true;
        this.step2Submitted = true;
        if (this.submitting) return;
        if (this.studentForm.invalid) {
            this.activeStep = this.studentForm.get('profile')?.invalid ? 2 : 1;
            return;
        }

        const formValue = this.studentForm.getRawValue();
        const profile = this.stripEmpty(formValue.profile);
        const payload: any = this.stripEmpty({
            username: formValue.username,
            email: formValue.email,
            phone: formValue.phone,
            accountStatus: formValue.accountStatus,
            roleId: formValue.roleId,
            profile
        });
        if (formValue.password) {
            payload.password = formValue.password;
        }

        this.submitting = true;
        if (!this.viewOnly) {
            this.studentForm.disable();
        }

        if (this.currentStudentId) {
            this.studentService.update(this.currentStudentId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: this.translate.instant('common.successful'),
                        detail: this.translate.instant('common.updated', { entity: this.translate.instant('entities.student') }),
                        life: 3000
                    });
                    this.studentCreatedId = this.currentStudentId;
                    this.activeStep = 4;
                    this.submitting = false;
                    this.studentForm.enable();
                },
                error: () => {
                    this.submitting = false;
                    this.studentForm.enable();
                }
            });
            return;
        }

        this.studentService.create(payload).subscribe({
            next: (created) => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translate.instant('common.successful'),
                    detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.student') }),
                    life: 3000
                });
                this.studentCreatedId = created.id;
                this.currentStudentId = created.id;
                this.activeStep = 4;
                this.submitting = false;
                this.studentForm.enable();
            },
            error: () => {
                this.submitting = false;
                this.studentForm.enable();
            }
        });
    }

    saveGuardian1() {
        this.guardian1Submitted = true;
        if (this.submitting || !this.studentCreatedId) return;
        if (this.guardianForm1.invalid) {
            return;
        }

        const formValue = this.guardianForm1.getRawValue();
        const payload: any = this.stripEmpty({
            username: formValue.username,
            phone: formValue.phone,
            roleId: formValue.roleId,
            profile: this.stripEmpty({
                firstName: formValue.firstName,
                lastName: formValue.lastName
            })
        });
        if (formValue.password) {
            payload.password = formValue.password;
        }

        this.submitting = true;
        this.guardianForm1.disable();

        this.studentService.create(payload).subscribe({
            next: (guardian) => {
                this.familyRelationService
                    .create({
                        studentId: this.studentCreatedId as string,
                        familyMemberId: guardian.id,
                        relationType: formValue.relationType
                    })
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: this.translate.instant('common.successful'),
                                detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.guardian') }),
                                life: 3000
                            });
                            this.activeStep = 5;
                            this.submitting = false;
                            this.guardianForm1.enable();
                        },
                        error: () => {
                            this.submitting = false;
                            this.guardianForm1.enable();
                        }
                    });
            },
            error: () => {
                this.submitting = false;
                this.guardianForm1.enable();
            }
        });
    }

    saveGuardian2() {
        this.guardian2Submitted = true;
        if (this.submitting || !this.studentCreatedId) return;
        if (this.guardianForm2.invalid) {
            return;
        }

        const formValue = this.guardianForm2.getRawValue();
        const payload: any = this.stripEmpty({
            username: formValue.username,
            phone: formValue.phone,
            roleId: formValue.roleId,
            profile: this.stripEmpty({
                firstName: formValue.firstName,
                lastName: formValue.lastName
            })
        });
        if (formValue.password) {
            payload.password = formValue.password;
        }

        this.submitting = true;
        this.guardianForm2.disable();

        this.studentService.create(payload).subscribe({
            next: (guardian) => {
                this.familyRelationService
                    .create({
                        studentId: this.studentCreatedId as string,
                        familyMemberId: guardian.id,
                        relationType: formValue.relationType
                    })
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: this.translate.instant('common.successful'),
                                detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.guardian') }),
                                life: 3000
                            });
                            this.studentDialog = false;
                            this.loadStudents(this.meta().page, this.meta().perPage);
                            this.submitting = false;
                            this.guardianForm2.enable();
                        },
                        error: () => {
                            this.submitting = false;
                            this.guardianForm2.enable();
                        }
                    });
            },
            error: () => {
                this.submitting = false;
                this.guardianForm2.enable();
            }
        });
    }

    finishGuardianFlow() {
        this.studentDialog = false;
        this.studentCreatedId = undefined;
        this.activeStep = 1;
        this.guardian1Submitted = false;
        this.guardian2Submitted = false;
        this.submitting = false;
        this.studentForm.enable();
        this.guardianForm1.enable();
        this.guardianForm2.enable();
        this.loadStudents(this.meta().page, this.meta().perPage);
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
            this.activeStep = 3;
        }
    }

    private isStep1Valid(): boolean {
        const controls = ['username', 'password', 'roleId'];
        if (this.currentStudentId) {
            controls.splice(1, 2);
        }
        this.applyRoleId();
        controls.forEach((field) => this.studentForm.get(field)?.markAsTouched());
        return controls.every((field) => this.studentForm.get(field)?.valid);
    }

    private isStep2Valid(): boolean {
        const firstName = this.studentForm.get('profile.firstName');
        const lastName = this.studentForm.get('profile.lastName');
        firstName?.markAsTouched();
        lastName?.markAsTouched();
        return !!firstName?.valid && !!lastName?.valid;
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadStudents(page, perPage);
    }

    private setColumns() {
        this.cols = [
            { field: 'username', header: this.translate.instant('fields.username') },
            { field: 'email', header: this.translate.instant('fields.email') },
            { field: 'phone', header: this.translate.instant('fields.phone') },
            { field: 'accountStatus', header: this.translate.instant('fields.account_status') }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    private setAccountStatusOptions() {
        this.accountStatusOptions = Object.values(AccountStatus).map((value) => ({
            label: this.translate.instant(`enums.account_status.${value}`),
            value
        }));
    }

    accountStatusLabel(value?: AccountStatus) {
        if (!value) return '-';
        return this.translate.instant(`enums.account_status.${value}`);
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }

    private stripEmpty<T extends Record<string, any>>(value: T): Partial<T> {
        return Object.fromEntries(
            Object.entries(value).filter(([, val]) => val !== '' && val !== null && val !== undefined)
        ) as Partial<T>;
    }

    private setRelationOptions() {
        this.relationTypeOptions = [
            { label: this.translate.instant('relations.father'), value: RelationType.Father },
            { label: this.translate.instant('relations.mother'), value: RelationType.Mother }
        ];
    }

    private getRoleId(): string {
        const role = this.roles().find((item) => item.name === STUDENT_ROLE_FILTER);
        return role?.id !== undefined && role?.id !== null ? String(role.id) : '';
    }

    private applyRoleId() {
        if (this.viewOnly) return;
        const control = this.studentForm.get('roleId');
        const currentValue = control?.value;
        if (currentValue) return;
        const roleId = this.getRoleId();
        if (roleId) {
            control?.setValue(roleId);
        }
    }
}

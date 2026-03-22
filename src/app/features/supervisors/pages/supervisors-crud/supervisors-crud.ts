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
import { SupervisorService } from '@/app/features/supervisors/services/supervisor.service';
import { Supervisor, SupervisorsMeta } from '@/app/features/supervisors/models/supervisor.model';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';
import { RoleService } from '@/app/features/roles/services/role.service';
import { Role } from '@/app/features/roles/models/role.model';

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
    selector: 'app-supervisors-crud',
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
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelectedSupervisors()" [disabled]="!selectedSupervisors || !selectedSupervisors.length" />
            </ng-template>

            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="supervisors()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['username', 'email', 'phone', 'accountStatus']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedSupervisors"
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
                    <h5 class="m-0">{{ 'pages.supervisors.manage_title' | translate }}</h5>
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
            <ng-template #body let-supervisor>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="supervisor" />
                    </td>
                    <td style="min-width: 16rem">{{ supervisor.username }}</td>
                    <td style="min-width: 18rem">{{ supervisor.email }}</td>
                    <td style="min-width: 14rem">{{ supervisor.phone }}</td>
                    <td style="min-width: 10rem">{{ supervisor.accountStatus }}</td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewSupervisor(supervisor)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editSupervisor(supervisor)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteSupervisor(supervisor)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="supervisorDialog" [style]="{ width: '780px' }" [header]="'pages.supervisors.details_title' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="supervisorForm">
                    <p-stepper [value]="activeStep">
                        <p-step-list>
                            <p-step [value]="1">{{ 'wizard.account' | translate }}</p-step>
                            <p-step [value]="2">{{ 'wizard.profile' | translate }}</p-step>
                            <p-step [value]="3">{{ 'wizard.additional' | translate }}</p-step>
                        </p-step-list>
                        <p-step-panels>
                            <p-step-panel [value]="1">
                                <ng-template #content>
                                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label for="username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="username" formControlName="username" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="supervisorForm.get('username')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                                            <p-password id="password" formControlName="password" [toggleMask]="true" [feedback]="false" [fluid]="true" [disabled]="submitting || viewOnly"></p-password>
                                            <app-form-errors [control]="supervisorForm.get('password')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="email" class="block font-bold mb-3">{{ 'fields.email' | translate }}</label>
                                            <input type="text" pInputText id="email" formControlName="email" fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="supervisorForm.get('email')" [show]="step1Submitted"></app-form-errors>
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
                                        <div>
                                            <label for="roleId" class="block font-bold mb-3">{{ 'fields.role' | translate }} <span class="text-red-500">*</span></label>
                                            <p-select
                                                id="roleId"
                                                [options]="roles()"
                                                optionLabel="name"
                                                optionValue="id"
                                                formControlName="roleId"
                                                appendTo="body"
                                                [disabled]="submitting || viewOnly"
                                                [placeholder]="'common.select_role' | translate"
                                                fluid
                                            />
                                            <app-form-errors [control]="supervisorForm.get('roleId')" [show]="step1Submitted"></app-form-errors>
                                        </div>
                                    </div>
                                    <div class="flex justify-end gap-2 mt-6">
                                        <p-button [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextFromStep1()" [disabled]="submitting"></p-button>
                                    </div>
                                </ng-template>
                            </p-step-panel>
                            <p-step-panel [value]="2">
                                <ng-template #content>
                                    <div formGroupName="profile" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label for="firstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="firstName" formControlName="firstName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="supervisorForm.get('profile.firstName')" [show]="step2Submitted"></app-form-errors>
                                        </div>
                                        <div>
                                            <label for="lastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                                            <input type="text" pInputText id="lastName" formControlName="lastName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                                            <app-form-errors [control]="supervisorForm.get('profile.lastName')" [show]="step2Submitted"></app-form-errors>
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
                                        <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 1" [disabled]="submitting"></p-button>
                                        <p-button [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextFromStep2()" [disabled]="submitting"></p-button>
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
                                        <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" (onClick)="activeStep = 2" [disabled]="submitting"></p-button>
                                        <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="saveSupervisor()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting"></p-button>
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
export class SupervisorsCrud implements OnInit {
    supervisorDialog: boolean = false;
    viewOnly: boolean = false;

    supervisors = signal<Supervisor[]>([]);
    meta = signal<SupervisorsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    roles = signal<Role[]>([]);

    supervisorForm: FormGroup;
    currentSupervisorId?: string;

    selectedSupervisors!: Supervisor[] | null;

    loading: boolean = false;
    rolesLoading: boolean = false;
    submitting: boolean = false;

    activeStep = 1;
    step1Submitted = false;
    step2Submitted = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];
    accountStatusOptions = Object.values(AccountStatus).map((value) => ({ label: value, value }));

    constructor(
        private supervisorService: SupervisorService,
        private roleService: RoleService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.supervisorForm = this.fb.group({
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
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadSupervisors(1, 10);
        this.loadRoles();

        this.setColumns();
        this.translate.onLangChange.subscribe(() => this.setColumns());
    }

    loadSupervisors(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.supervisorService.list(page, perPage).subscribe({
            next: (res) => {
                this.supervisors.set(res?.data ?? []);
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
        this.currentSupervisorId = undefined;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.activeStep = 1;
        this.supervisorForm.reset({
            username: '',
            password: '',
            email: '',
            phone: '',
            accountStatus: '',
            roleId: '',
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
        const passwordControl = this.supervisorForm.get('password');
        passwordControl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(20)]);
        passwordControl?.updateValueAndValidity();
        this.supervisorForm.enable();
        this.supervisorDialog = true;
    }

    editSupervisor(supervisor: Supervisor) {
        this.viewOnly = false;
        this.activeStep = 1;
        this.supervisorDialog = true;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.supervisorService.get(supervisor.id).subscribe((data) => {
            this.currentSupervisorId = data.id;
            this.supervisorForm.reset({
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
            const passwordControl = this.supervisorForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.supervisorForm.enable();
        });
    }

    viewSupervisor(supervisor: Supervisor) {
        this.viewOnly = true;
        this.activeStep = 1;
        this.supervisorDialog = true;
        this.step1Submitted = false;
        this.step2Submitted = false;
        this.supervisorService.get(supervisor.id).subscribe((data) => {
            this.currentSupervisorId = data.id;
            this.supervisorForm.reset({
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
            const passwordControl = this.supervisorForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.supervisorForm.disable();
        });
    }

    deleteSelectedSupervisors() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', {
                entity: this.translate.instant('entities.supervisors')
            }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedSupervisors ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((s) => {
                    this.supervisorService.delete(s.id).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: this.translate.instant('common.successful'),
                                    detail: this.translate.instant('common.deleted_many', {
                                        entity: this.translate.instant('entities.supervisors')
                                    }),
                                    life: 3000
                                });
                                this.selectedSupervisors = null;
                                this.loadSupervisors(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    deleteSupervisor(supervisor: Supervisor) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: supervisor.username }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.supervisorService.delete(supervisor.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.supervisor') }),
                            life: 3000
                        });
                        this.loadSupervisors(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    saveSupervisor() {
        this.step1Submitted = true;
        this.step2Submitted = true;
        if (this.submitting) return;
        if (this.supervisorForm.invalid) {
            this.activeStep = this.supervisorForm.get('profile')?.invalid ? 2 : 1;
            return;
        }

        const formValue = this.supervisorForm.getRawValue();
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
            this.supervisorForm.disable();
        }

        if (this.currentSupervisorId) {
            this.supervisorService.update(this.currentSupervisorId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: this.translate.instant('common.successful'),
                        detail: this.translate.instant('common.updated', { entity: this.translate.instant('entities.supervisor') }),
                        life: 3000
                    });
                    this.supervisorDialog = false;
                    this.loadSupervisors(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                    this.supervisorForm.enable();
                },
                error: () => {
                    this.submitting = false;
                    this.supervisorForm.enable();
                }
            });
            return;
        }

        this.supervisorService.create(payload).subscribe({
            next: () => {
            this.messageService.add({
                severity: 'success',
                summary: this.translate.instant('common.successful'),
                detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.supervisor') }),
                life: 3000
            });
                this.supervisorDialog = false;
                this.loadSupervisors(this.meta().page, this.meta().perPage);
                this.submitting = false;
                this.supervisorForm.enable();
            },
            error: () => {
                this.submitting = false;
                this.supervisorForm.enable();
            }
        });
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
        if (this.currentSupervisorId) {
            controls.splice(1, 1);
        }
        controls.forEach((field) => this.supervisorForm.get(field)?.markAsTouched());
        return controls.every((field) => this.supervisorForm.get(field)?.valid);
    }

    private isStep2Valid(): boolean {
        const firstName = this.supervisorForm.get('profile.firstName');
        const lastName = this.supervisorForm.get('profile.lastName');
        firstName?.markAsTouched();
        lastName?.markAsTouched();
        return !!firstName?.valid && !!lastName?.valid;
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadSupervisors(page, perPage);
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

    private stripEmpty<T extends Record<string, any>>(value: T): Partial<T> {
        return Object.fromEntries(
            Object.entries(value).filter(([, val]) => val !== '' && val !== null && val !== undefined)
        ) as Partial<T>;
    }
}

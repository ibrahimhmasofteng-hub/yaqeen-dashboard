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
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
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

const SUPERVISOR_ROLE_FILTER = RoleName.Supervisor;

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
                    <td style="min-width: 16rem">{{ displayValue(supervisor.username) }}</td>
                    <td style="min-width: 18rem">{{ displayValue(supervisor.email) }}</td>
                    <td style="min-width: 14rem">{{ displayValue(supervisor.phone) }}</td>
                    <td style="min-width: 10rem">{{ accountStatusLabel(supervisor.accountStatus) }}</td>
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
                    <input type="hidden" formControlName="roleId" />
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        <div>
                            <label for="username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="username" formControlName="username" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="supervisorForm.get('username')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                            <input type="password" pInputText id="password" formControlName="password" required fluid [disabled]="submitting || viewOnly" />
                            <app-form-errors [control]="supervisorForm.get('password')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="email" class="block font-bold mb-3">{{ 'fields.email' | translate }}</label>
                            <input type="text" pInputText id="email" formControlName="email" fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="supervisorForm.get('email')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="phone" class="block font-bold mb-3">{{ 'fields.phone' | translate }}</label>
                            <input type="text" pInputText id="phone" formControlName="phone" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        </div>
                        <div>
                            <label for="firstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="firstName" formControlName="firstName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="supervisorForm.get('firstName')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="lastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="lastName" formControlName="lastName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="supervisorForm.get('lastName')" [show]="submitted"></app-form-errors>
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
                    </div>
                </form>
            </ng-template>
            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="hideDialog()" [disabled]="submitting" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="saveSupervisor()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
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

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];
    accountStatusOptions: { label: string; value: AccountStatus }[] = [];

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
            firstName: ['', Validators.required],
            lastName: ['', Validators.required]
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadSupervisors(1, 10);
        this.loadRoles();

        this.setColumns();
        this.setAccountStatusOptions();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
            this.setAccountStatusOptions();
        });
    }

    loadSupervisors(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.supervisorService.list(page, perPage, SUPERVISOR_ROLE_FILTER).subscribe({
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
        this.currentSupervisorId = undefined;
        this.submitted = false;
        this.supervisorForm.reset({
            username: '',
            password: '',
            email: '',
            phone: '',
            accountStatus: '',
            roleId: this.getRoleId(),
            firstName: '',
            lastName: ''
        });
        const passwordControl = this.supervisorForm.get('password');
        passwordControl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(20)]);
        passwordControl?.updateValueAndValidity();
        this.supervisorForm.enable();
        this.applyRoleId();
        this.supervisorDialog = true;
    }

    editSupervisor(supervisor: Supervisor) {
        this.viewOnly = false;
        this.supervisorDialog = true;
        this.submitted = false;
        this.supervisorService.get(supervisor.id).subscribe((data) => {
            this.currentSupervisorId = data.id;
            this.supervisorForm.reset({
                username: data.username ?? '',
                password: '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                accountStatus: data.accountStatus ?? '',
                roleId: data.roleId ?? '',
                firstName: data.profile?.firstName ?? '',
                lastName: data.profile?.lastName ?? ''
            });
            const passwordControl = this.supervisorForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.supervisorForm.enable();
        });
    }

    viewSupervisor(supervisor: Supervisor) {
        this.viewOnly = true;
        this.supervisorDialog = true;
        this.submitted = false;
        this.supervisorService.get(supervisor.id).subscribe((data) => {
            this.currentSupervisorId = data.id;
            this.supervisorForm.reset({
                username: data.username ?? '',
                password: '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                accountStatus: data.accountStatus ?? '',
                roleId: data.roleId ?? '',
                firstName: data.profile?.firstName ?? '',
                lastName: data.profile?.lastName ?? ''
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

    hideDialog() {
        this.supervisorDialog = false;
        this.submitted = false;
        this.viewOnly = false;
        this.supervisorForm.enable();
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
        this.submitted = true;
        if (this.submitting) return;
        if (this.supervisorForm.invalid) return;

        const formValue = this.supervisorForm.getRawValue();
        const payload: any = this.stripEmpty({
            username: formValue.username,
            email: formValue.email,
            phone: formValue.phone,
            accountStatus: formValue.accountStatus,
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

    private getRoleId(): string {
        const role = this.roles().find((item) => item.name === SUPERVISOR_ROLE_FILTER);
        return role?.id !== undefined && role?.id !== null ? String(role.id) : '';
    }

    private applyRoleId() {
        if (this.currentSupervisorId || this.viewOnly) return;
        const roleId = this.getRoleId();
        if (roleId) {
            this.supervisorForm.get('roleId')?.setValue(roleId);
        }
    }
}

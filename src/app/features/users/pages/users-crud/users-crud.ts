import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TagModule } from 'primeng/tag';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '@/app/features/users/services/user.service';
import { RoleService } from '@/app/features/roles/services/role.service';
import { Role } from '@/app/features/roles/models/role.model';
import { User, UsersMeta } from '@/app/features/users/models/user.model';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';
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
    selector: 'app-users-crud',
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
        TagModule,
        FormErrors,
        TranslateModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsers()" [disabled]="!selectedUsers || !selectedUsers.length" />
            </ng-template>

            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="users()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['username', 'email', 'phone', 'accountStatus']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedUsers"
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
                    <h5 class="m-0">{{ 'pages.users.manage_title' | translate }}</h5>
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
            <ng-template #body let-user>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="user" />
                    </td>
                    <td style="min-width: 16rem">{{ user.username }}</td>
                    <td style="min-width: 18rem">{{ user.email }}</td>
                    <td style="min-width: 14rem">{{ user.phone }}</td>
                    <td style="min-width: 10rem">
                        {{ accountStatusLabel(user.accountStatus) }}
                    </td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewUser(user)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUser(user)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUser(user)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '780px' }" [header]="'pages.users.details_title' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="userForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        <div>
                            <label for="username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="username" formControlName="username" required autofocus fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="userForm.get('username')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="email" class="block font-bold mb-3">{{ 'fields.email' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="email" formControlName="email" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="userForm.get('email')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="phone" class="block font-bold mb-3">{{ 'fields.phone' | translate }}</label>
                            <input type="text" pInputText id="phone" formControlName="phone" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        </div>
                        <div *ngIf="!currentUserId">
                            <label for="password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                            <input type="password" pInputText id="password" formControlName="password" required fluid [disabled]="submitting" />
                            <app-form-errors [control]="userForm.get('password')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="roleId" class="block font-bold mb-3">{{ 'fields.role' | translate }}</label>
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
                    <div formGroupName="profile" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label for="firstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }}</label>
                            <input type="text" pInputText id="firstName" formControlName="firstName" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        </div>
                        <div>
                            <label for="lastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }}</label>
                            <input type="text" pInputText id="lastName" formControlName="lastName" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        </div>
                        <div>
                            <label for="nationalId" class="block font-bold mb-3">{{ 'fields.national_id' | translate }}</label>
                            <input type="text" pInputText id="nationalId" formControlName="nationalId" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        </div>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="hideDialog()" [disabled]="submitting" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="saveUser()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class UsersCrud implements OnInit {
    userDialog: boolean = false;
    viewOnly: boolean = false;

    users = signal<User[]>([]);
    meta = signal<UsersMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;
    roles = signal<Role[]>([]);
    rolesLoading: boolean = false;

    userForm: FormGroup;
    currentUserId?: string;

    selectedUsers!: User[] | null;

    submitted: boolean = false;
    submitting: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];
    accountStatusOptions: { label: string; value: AccountStatus }[] = [];

    constructor(
        private userService: UserService,
        private roleService: RoleService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.userForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            password: [''],
            roleId: [''],
            accountStatus: [''],
            profile: this.fb.group({
                firstName: [''],
                lastName: [''],
                nationalId: ['']
            })
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadUsers(1, 10);
        this.loadRoles();
        this.setColumns();
        this.setAccountStatusOptions();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
            this.setAccountStatusOptions();
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

    loadUsers(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.userService.list(page, perPage).subscribe({
            next: (res) => {
                this.users.set(res?.data ?? []);
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
        this.currentUserId = undefined;
        this.submitted = false;
        this.userForm.reset({
            username: '',
            email: '',
            phone: '',
            password: '',
            roleId: '',
            accountStatus: '',
            profile: {
                firstName: '',
                lastName: '',
                nationalId: ''
            }
        });
        const passwordControl = this.userForm.get('password');
        passwordControl?.setValidators([Validators.required]);
        passwordControl?.updateValueAndValidity();
        this.userForm.enable();
        this.userDialog = true;
    }

    editUser(user: User) {
        this.viewOnly = false;
        this.userDialog = true;
        this.userService.get(user.id).subscribe((data) => {
            this.currentUserId = data.id;
            this.userForm.reset({
                username: data.username ?? '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                password: '',
                roleId: data.roleId ?? '',
                accountStatus: data.accountStatus ?? '',
                profile: {
                    firstName: data.profile?.firstName ?? '',
                    lastName: data.profile?.lastName ?? '',
                    nationalId: data.profile?.nationalId ?? ''
                }
            });
            const passwordControl = this.userForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.userForm.enable();
        });
    }

    viewUser(user: User) {
        this.viewOnly = true;
        this.userDialog = true;
        this.userService.get(user.id).subscribe((data) => {
            this.currentUserId = data.id;
            this.userForm.reset({
                username: data.username ?? '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                password: '',
                roleId: data.roleId ?? '',
                accountStatus: data.accountStatus ?? '',
                profile: {
                    firstName: data.profile?.firstName ?? '',
                    lastName: data.profile?.lastName ?? '',
                    nationalId: data.profile?.nationalId ?? ''
                }
            });
            const passwordControl = this.userForm.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.userForm.disable();
        });
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', {
                entity: this.translate.instant('entities.users')
            }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedUsers ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((u) => {
                    this.userService.delete(u.id).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: this.translate.instant('common.successful'),
                                    detail: this.translate.instant('common.deleted_many', {
                                        entity: this.translate.instant('entities.users')
                                    }),
                                    life: 3000
                                });
                                this.selectedUsers = null;
                                this.loadUsers(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
        this.viewOnly = false;
        this.userForm.enable();
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: user.username }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.delete(user.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.user') }),
                            life: 3000
                        });
                        this.loadUsers(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    saveUser() {
        this.submitted = true;
        if (this.submitting) return;
        if (this.userForm.invalid) return;

        const formValue = this.userForm.getRawValue();
        const payload: any = {
            username: formValue.username,
            email: formValue.email,
            phone: formValue.phone || undefined,
            accountStatus: formValue.accountStatus || undefined,
            roleId: formValue.roleId || undefined,
            profile: formValue.profile
        };
        if (formValue.password) {
            payload.password = formValue.password;
        }

        this.submitting = true;
        if (!this.viewOnly) {
            this.userForm.disable();
        }

        if (this.currentUserId) {
            this.userService.update(this.currentUserId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: this.translate.instant('common.successful'),
                        detail: this.translate.instant('common.updated', { entity: this.translate.instant('entities.user') }),
                        life: 3000
                    });
                    this.userDialog = false;
                    this.loadUsers(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                    this.userForm.enable();
                },
                error: () => {
                    this.submitting = false;
                    this.userForm.enable();
                }
            });
            return;
        }

        this.userService.create(payload).subscribe({
            next: () => {
            this.messageService.add({
                severity: 'success',
                summary: this.translate.instant('common.successful'),
                detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.user') }),
                life: 3000
            });
                this.userDialog = false;
                this.loadUsers(this.meta().page, this.meta().perPage);
                this.submitting = false;
                this.userForm.enable();
            },
            error: () => {
                this.submitting = false;
                this.userForm.enable();
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadUsers(page, perPage);
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

    accountStatusLabel(value: AccountStatus) {
        return this.translate.instant(`enums.account_status.${value}`);
    }

}

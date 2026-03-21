import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RoleService } from '@/app/features/roles/services/role.service';
import { Role, RolePermission, RolesMeta } from '@/app/features/roles/models/role.model';
import { Permission } from '@/app/features/permissions/models/permission.model';
import { PermissionService } from '@/app/features/permissions/services/permission.service';
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
    selector: 'app-roles-crud',
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
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CheckboxModule,
        FormErrors
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedRoles()" [disabled]="!selectedRoles || !selectedRoles.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="roles()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name']"
            [tableStyle]="{ 'min-width': '70rem' }"
            [(selection)]="selectedRoles"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            [totalRecords]="meta().total"
            [lazy]="true"
            (onPage)="onPage($event)"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Manage Roles</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                    <th pSortableColumn="name" style="min-width: 20rem">
                        Name
                        <p-sortIcon field="name" />
                    </th>
                    <th style="min-width: 12rem">Permissions</th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-role>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="role" />
                    </td>
                    <td style="min-width: 20rem">{{ role.name }}</td>
                    <td style="min-width: 12rem">{{ role.permissions?.length ?? 0 }}</td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewRole(role)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editRole(role)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteRole(role)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="roleDialog" [style]="{ width: '520px' }" header="Role Details" [modal]="true">
            <ng-template #content>
                <form [formGroup]="roleForm">
                    <div class="flex flex-col gap-6">
                        <div>
                            <label for="name" class="block font-bold mb-3">Name <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="name" formControlName="name" required autofocus fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="roleForm.get('name')" [show]="submitted"></app-form-errors>
                        </div>

                        <div formArrayName="permissions" class="flex flex-col gap-4">
                            <label class="block font-bold">Permissions</label>

                            <div *ngIf="permissionsLoading" class="text-sm text-surface-500">
                                Loading permissions...
                            </div>

                            <div *ngIf="!permissionsLoading && permissionsArray.controls.length === 0" class="text-sm text-surface-500">
                                No permissions available.
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                <div
                                    *ngFor="let permissionGroup of permissionsArray.controls; let i = index"
                                    [formGroupName]="i"
                                    class="flex items-start gap-3 p-3"
                                >
                                    <p-checkbox formControlName="enabled" binary [disabled]="submitting || viewOnly"></p-checkbox>
                                    <div class="flex flex-col">
                                        <span class="font-semibold">{{ permissionGroup.get('name')?.value || permissionGroup.get('id')?.value }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" [disabled]="submitting" />
                <p-button label="Save" icon="pi pi-check" (click)="saveRole()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class RolesCrud implements OnInit {
    roleDialog: boolean = false;
    viewOnly: boolean = false;

    roles = signal<Role[]>([]);
    meta = signal<RolesMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;
    availablePermissions = signal<Permission[]>([]);
    permissionsLoading: boolean = false;

    roleForm: FormGroup;
    currentRoleId?: string | number;
    lastRolePermissions?: RolePermission[];

    selectedRoles!: Role[] | null;

    submitted: boolean = false;
    submitting: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private roleService: RoleService,
        private permissionService: PermissionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            permissions: this.fb.array([])
        });
    }

    get permissionsArray(): FormArray {
        return this.roleForm.get('permissions') as FormArray;
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadRoles(1, 10);
        this.loadPermissions();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'permissions', header: 'Permissions' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadRoles(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.roleService.list(page, perPage).subscribe({
            next: (res) => {
                this.roles.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadPermissions() {
        if (this.permissionsLoading) return;
        this.permissionsLoading = true;
        this.permissionService.list(1, 100).subscribe({
            next: (res) => {
                this.availablePermissions.set(res?.data ?? []);
                this.permissionsLoading = false;
                if (this.roleDialog) {
                    this.initializePermissions(this.lastRolePermissions);
                }
            },
            error: () => {
                this.permissionsLoading = false;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.viewOnly = false;
        this.currentRoleId = undefined;
        this.lastRolePermissions = undefined;
        this.submitted = false;
        this.roleForm.reset({ name: '' });
        this.initializePermissions();
        this.roleForm.enable();
        this.roleDialog = true;
    }

    editRole(role: Role) {
        this.viewOnly = false;
        this.roleDialog = true;
        this.roleService.get(role.id ?? '').subscribe((data) => {
            this.currentRoleId = data.id;
            this.lastRolePermissions = data.permissions ?? [];
            this.roleForm.reset({ name: data.name ?? '' });
            this.initializePermissions(data.permissions ?? []);
            this.roleForm.enable();
        });
    }

    viewRole(role: Role) {
        this.viewOnly = true;
        this.roleDialog = true;
        this.roleService.get(role.id ?? '').subscribe((data) => {
            this.currentRoleId = data.id;
            this.lastRolePermissions = data.permissions ?? [];
            this.roleForm.reset({ name: data.name ?? '' });
            this.initializePermissions(data.permissions ?? []);
            this.roleForm.disable();
        });
    }

    deleteSelectedRoles() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected roles?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedRoles ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((r) => {
                    if (!r.id) {
                        remaining -= 1;
                        return;
                    }
                    this.roleService.delete(r.id).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Successful',
                                    detail: 'Roles Deleted',
                                    life: 3000
                                });
                                this.selectedRoles = null;
                                this.loadRoles(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    hideDialog() {
        this.roleDialog = false;
        this.submitted = false;
        this.viewOnly = false;
        this.lastRolePermissions = undefined;
        this.roleForm.enable();
    }

    deleteRole(role: Role) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + role.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (!role.id) return;
                this.roleService.delete(role.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Role Deleted',
                            life: 3000
                        });
                        this.loadRoles(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    saveRole() {
        this.submitted = true;
        if (this.submitting) return;
        if (this.roleForm.invalid) return;

        const formValue = this.roleForm.getRawValue();
        const permissions = (formValue.permissions ?? [])
            .filter((permission: RolePermission) => !!permission.enabled)
            .map((permission: RolePermission) => ({
                id: permission.id,
                enabled: true
            }));

        const payload = {
            name: formValue.name,
            permissions
        };

        this.submitting = true;
        if (!this.viewOnly) {
            this.roleForm.disable();
        }

        if (this.currentRoleId) {
            this.roleService.update(this.currentRoleId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Role Updated',
                        life: 3000
                    });
                    this.roleDialog = false;
                    this.loadRoles(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                    this.roleForm.enable();
                },
                error: () => {
                    this.submitting = false;
                    this.roleForm.enable();
                }
            });
            return;
        }

        this.roleService.create(payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Role Created',
                    life: 3000
                });
                this.roleDialog = false;
                this.loadRoles(this.meta().page, this.meta().perPage);
                this.submitting = false;
                this.roleForm.enable();
            },
            error: () => {
                this.submitting = false;
                this.roleForm.enable();
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadRoles(page, perPage);
    }

    private initializePermissions(rolePermissions?: RolePermission[]) {
        const available = this.availablePermissions();
        const permissionsById = new Map<string | number, RolePermission>();
        (rolePermissions ?? []).forEach((permission) => {
            if (permission?.id !== undefined && permission?.id !== null) {
                permissionsById.set(permission.id, permission);
            }
        });
        this.permissionsArray.clear();
        available.forEach((permission) => {
            const rolePermission = permission.id !== undefined ? permissionsById.get(permission.id) : undefined;
            this.permissionsArray.push(
                this.fb.group({
                    id: [permission.id ?? '', Validators.required],
                    name: [permission.name ?? ''],
                    enabled: [rolePermission?.enabled ?? false]
                })
            );
        });
    }
}

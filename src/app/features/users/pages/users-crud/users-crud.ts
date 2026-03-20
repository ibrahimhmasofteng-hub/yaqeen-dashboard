import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { UserService } from '@/app/features/users/services/user.service';
import { User, UserProfile, UsersMeta } from '@/app/features/users/models/user.model';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

type EditableUser = Partial<User> & {
    password?: string;
    profile?: UserProfile;
};


@Component({
    selector: 'app-users-crud',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
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
        TagModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsers()" [disabled]="!selectedUsers || !selectedUsers.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="users()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['username', 'email', 'phone', 'accountStatus']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedUsers"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            [totalRecords]="meta().total"
            [lazy]="true"
            (onPage)="onPage($event)"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Manage Users</h5>
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
                    <th pSortableColumn="username" style="min-width:16rem">
                        Username
                        <p-sortIcon field="username" />
                    </th>
                    <th pSortableColumn="email" style="min-width: 18rem">
                        Email
                        <p-sortIcon field="email" />
                    </th>
                    <th pSortableColumn="phone" style="min-width: 14rem">
                        Phone
                        <p-sortIcon field="phone" />
                    </th>
                    <th pSortableColumn="accountStatus" style="min-width: 10rem">
                        Status
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
                        <p-tag *ngIf="user.accountStatus" [value]="user.accountStatus" />
                    </td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewUser(user)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUser(user)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUser(user)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '450px' }" header="User Details" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="username" class="block font-bold mb-3">Username</label>
                        <input type="text" pInputText id="username" [(ngModel)]="user.username" required autofocus fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <small class="text-red-500" *ngIf="submitted && !user.username">Username is required.</small>
                    </div>
                    <div>
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <input type="text" pInputText id="email" [(ngModel)]="user.email" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <small class="text-red-500" *ngIf="submitted && !user.email">Email is required.</small>
                    </div>
                    <div>
                        <label for="phone" class="block font-bold mb-3">Phone</label>
                        <input type="text" pInputText id="phone" [(ngModel)]="user.phone" fluid [readonly]="viewOnly" [disabled]="submitting" />
                    </div>
                    <div *ngIf="!user.id">
                        <label for="password" class="block font-bold mb-3">Password</label>
                        <input type="password" pInputText id="password" [(ngModel)]="user.password" required fluid [disabled]="submitting" />
                        <small class="text-red-500" *ngIf="submitted && !user.password">Password is required.</small>
                    </div>
                    <div>
                        <label for="roleId" class="block font-bold mb-3">Role ID</label>
                        <input type="text" pInputText id="roleId" [(ngModel)]="user.roleId" fluid [readonly]="viewOnly" [disabled]="submitting" />
                    </div>
                    <div>
                        <label for="accountStatus" class="block font-bold mb-3">Account Status</label>
                        <p-select
                            id="accountStatus"
                            [options]="accountStatusOptions"
                            optionLabel="label"
                            optionValue="value"
                            [(ngModel)]="user.accountStatus"
                            [disabled]="submitting || viewOnly"
                            placeholder="Select Status"
                            fluid
                        />
                    </div>
                    <div>
                        <label for="firstName" class="block font-bold mb-3">First Name</label>
                        <input type="text" pInputText id="firstName" [(ngModel)]="profile.firstName" fluid [readonly]="viewOnly" [disabled]="submitting" />
                    </div>
                    <div>
                        <label for="lastName" class="block font-bold mb-3">Last Name</label>
                        <input type="text" pInputText id="lastName" [(ngModel)]="profile.lastName" fluid [readonly]="viewOnly" [disabled]="submitting" />
                    </div>
                    <div>
                        <label for="nationalId" class="block font-bold mb-3">National ID</label>
                        <input type="text" pInputText id="nationalId" [(ngModel)]="profile.nationalId" fluid [readonly]="viewOnly" [disabled]="submitting" />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" [disabled]="submitting" />
                <p-button label="Save" icon="pi pi-check" (click)="saveUser()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
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

    user: EditableUser = { profile: {} };
    profile: UserProfile = {};

    selectedUsers!: User[] | null;

    submitted: boolean = false;
    submitting: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];
    accountStatusOptions = Object.values(AccountStatus).map((value) => ({ label: value, value }));

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadUsers(1, 10);

        this.cols = [
            { field: 'username', header: 'Username' },
            { field: 'email', header: 'Email' },
            { field: 'phone', header: 'Phone' },
            { field: 'accountStatus', header: 'Status' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadUsers(page: number, perPage: number) {
        this.userService.list(page, perPage).subscribe((res) => {
            this.users.set(res?.data ?? []);
            this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.viewOnly = false;
        this.user = { profile: {} };
        this.profile = {};
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: User) {
        this.viewOnly = false;
        this.userDialog = true;
        this.userService.get(user.id).subscribe((data) => {
            this.user = { ...data, profile: data.profile ?? {} };
            this.profile = this.user.profile ?? {};
        });
    }

    viewUser(user: User) {
        this.viewOnly = true;
        this.userDialog = true;
        this.userService.get(user.id).subscribe((data) => {
            this.user = { ...data, profile: data.profile ?? {} };
            this.profile = this.user.profile ?? {};
        });
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected users?',
            header: 'Confirm',
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
                                    summary: 'Successful',
                                    detail: 'Users Deleted',
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
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + user.username + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.delete(user.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'User Deleted',
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
        if (!this.user.username || !this.user.email) {
            return;
        }

        if (this.user.id) {
            const payload: any = {
                username: this.user.username,
                email: this.user.email,
                phone: this.user.phone,
                accountStatus: this.user.accountStatus,
                roleId: this.user.roleId,
                profile: this.user.profile
            };
            if (this.user.password) {
                payload.password = this.user.password;
            }
            this.submitting = true;
            this.userService
                .update(this.user.id, payload)
                .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'User Updated',
                        life: 3000
                    });
                    this.userDialog = false;
                    this.user = { profile: {} };
                    this.profile = {};
                    this.loadUsers(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                },
                error: () => {
                    this.submitting = false;
                }
            });
        } else {
            if (!this.user.password) return;
            this.submitting = true;
            this.userService
                .create({
                    username: this.user.username!,
                    email: this.user.email!,
                    password: this.user.password,
                    phone: this.user.phone,
                    accountStatus: this.user.accountStatus,
                    roleId: this.user.roleId,
                    profile: this.profile
                })
                .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'User Created',
                        life: 3000
                    });
                    this.userDialog = false;
                    this.user = { profile: {} };
                    this.profile = {};
                    this.loadUsers(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                },
                error: () => {
                    this.submitting = false;
                }
            });
        }
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadUsers(page, perPage);
    }

}

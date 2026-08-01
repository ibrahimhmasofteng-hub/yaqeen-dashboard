import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '@/app/features/users/services/user.service';
import { User, UsersMeta } from '@/app/features/users/models/user.model';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';
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
    selector: 'app-guardians-crud',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
        TooltipModule,
        FormErrors,
        TranslateModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelected()" [disabled]="!selectedItems || !selectedItems.length" />
            </ng-template>

            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="items()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedItems"
            [rowHover]="true"
            dataKey="id"
            [currentPageReportTemplate]="'common.page_report' | translate"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            [totalRecords]="meta().total"
            [lazy]="true"
            (onPage)="onPage($event)"
            (onSort)="onSort($event)"
        >
            <ng-template #caption>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h5 class="m-0">{{ 'pages.guardians.manage_title' | translate }}</h5>
                    <div class="flex flex-wrap gap-2 items-center">
                        <p-select [options]="accountStatusOptions" [(ngModel)]="filterStatus" optionLabel="label" optionValue="value" [showClear]="true" [placeholder]="'fields.account_status' | translate" (onChange)="onFilterStatus($event.value ?? '')" appendTo="body" />
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onSearch($event)" [placeholder]="'common.search' | translate" />
                        </p-iconfield>
                    </div>
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
            <ng-template #body let-item>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="item" />
                    </td>
                    <td style="min-width: 16rem">{{ displayValue(item.username) }}</td>
                    <td style="min-width: 18rem">{{ displayValue(item.email) }}</td>
                    <td style="min-width: 14rem">{{ displayValue(item.phone) }}</td>
                    <td style="min-width: 10rem">
                        {{ accountStatusLabel(item.accountStatus) }}
                    </td>
                    <td>
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewItem(item)" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editItem(item)" />
                        <p-button icon="pi pi-users" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewStudents(item)" pTooltip="{{ 'pages.guardians.view_students' | translate }}" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteItem(item)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialog" [style]="{ width: '780px' }" [header]="'pages.guardians.details_title' | translate" [modal]="true">
            <ng-template #content>
                <form [formGroup]="form">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                        <div>
                            <label for="username" class="block font-bold mb-3">{{ 'fields.username' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="username" formControlName="username" required autofocus fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="form.get('username')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="email" class="block font-bold mb-3">{{ 'fields.email' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="email" formControlName="email" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="form.get('email')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="phone" class="block font-bold mb-3">{{ 'fields.phone' | translate }}</label>
                            <input type="text" pInputText id="phone" formControlName="phone" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        </div>
                        <div *ngIf="!currentId">
                            <label for="password" class="block font-bold mb-3">{{ 'fields.password' | translate }} <span class="text-red-500">*</span></label>
                            <input type="password" pInputText id="password" formControlName="password" required fluid [disabled]="submitting" />
                            <app-form-errors [control]="form.get('password')" [show]="submitted"></app-form-errors>
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
                            <label for="firstName" class="block font-bold mb-3">{{ 'fields.first_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="firstName" formControlName="firstName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="form.get('firstName')" [show]="submitted"></app-form-errors>
                        </div>
                        <div>
                            <label for="lastName" class="block font-bold mb-3">{{ 'fields.last_name' | translate }} <span class="text-red-500">*</span></label>
                            <input type="text" pInputText id="lastName" formControlName="lastName" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                            <app-form-errors [control]="form.get('lastName')" [show]="submitted"></app-form-errors>
                        </div>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="hideDialog()" [disabled]="submitting" />
                <p-button [label]="'common.save' | translate" icon="pi pi-check" (click)="save()" *ngIf="!viewOnly" [loading]="submitting" [disabled]="submitting" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />
    `,
    providers: [MessageService, ConfirmationService]
})
export class GuardiansCrud implements OnInit {
    dialog = false;
    viewOnly = false;

    items = signal<User[]>([]);
    meta = signal<UsersMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading = false;

    form: FormGroup;
    currentId?: string;
    currentProfileId?: string;

    selectedItems!: User[] | null;

    submitted = false;
    submitting = false;

    searchTerm = '';
    filterStatus = '';
    currentSort: { field: string; direction: 'asc' | 'desc' } | null = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];
    accountStatusOptions: { label: string; value: AccountStatus }[] = [];

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            password: [''],
            accountStatus: [''],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required]
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadItems(1, 10);
        this.setColumns();
        this.setAccountStatusOptions();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
            this.setAccountStatusOptions();
        });
    }

    loadItems(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.userService.list(page, perPage, {
            role: RoleName.Guardian,
            name: this.searchTerm || undefined,
            accountStatus: this.filterStatus || undefined,
            sort: this.currentSort || undefined
        }).subscribe({
            next: (res) => {
                this.items.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchTerm = value;
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadItems(1, this.meta().perPage), 400);
    }

    onFilterStatus(value: string) {
        this.filterStatus = value;
        this.loadItems(1, this.meta().perPage);
    }

    onSort(event: { field: string; order: number }) {
        this.currentSort = event.field ? { field: event.field, direction: event.order === 1 ? 'asc' : 'desc' } : null;
        this.loadItems(1, this.meta().perPage);
    }

    openNew() {
        this.viewOnly = false;
        this.currentId = undefined;
        this.currentProfileId = undefined;
        this.submitted = false;
        this.form.reset({
            username: '',
            email: '',
            phone: '',
            password: '',
            accountStatus: '',
            firstName: '',
            lastName: ''
        });
        const passwordControl = this.form.get('password');
        passwordControl?.setValidators([Validators.required]);
        passwordControl?.updateValueAndValidity();
        this.form.enable();
        this.dialog = true;
    }

    editItem(item: User) {
        this.viewOnly = false;
        this.userService.get(item.id).subscribe((data) => {
            this.currentId = data.id;
            this.currentProfileId = data.profile?.id;
            this.form.reset({
                username: data.username ?? '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                password: '',
                accountStatus: data.accountStatus ?? '',
                firstName: data.profile?.firstName ?? '',
                lastName: data.profile?.lastName ?? ''
            });
            const passwordControl = this.form.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.form.enable();
            this.dialog = true;
        });
    }

    viewItem(item: User) {
        this.viewOnly = true;
        this.userService.get(item.id).subscribe((data) => {
            this.currentId = data.id;
            this.currentProfileId = data.profile?.id;
            this.form.reset({
                username: data.username ?? '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                password: '',
                accountStatus: data.accountStatus ?? '',
                firstName: data.profile?.firstName ?? '',
                lastName: data.profile?.lastName ?? ''
            });
            const passwordControl = this.form.get('password');
            passwordControl?.clearValidators();
            passwordControl?.updateValueAndValidity();
            this.form.disable();
            this.dialog = true;
        });
    }

    viewStudents(item: User) {
        this.router.navigate(['/guardians', item.id, 'students']);
    }

    deleteSelected() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', {
                entity: this.translate.instant('entities.guardians')
            }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedItems ?? [];
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
                                        entity: this.translate.instant('entities.guardians')
                                    }),
                                    life: 3000
                                });
                                this.selectedItems = null;
                                this.loadItems(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    hideDialog() {
        this.dialog = false;
        this.submitted = false;
        this.viewOnly = false;
        this.form.enable();
    }

    deleteItem(item: User) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: item.username }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.delete(item.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.guardian') }),
                            life: 3000
                        });
                        this.loadItems(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    save() {
        this.submitted = true;
        if (this.submitting) return;
        if (this.form.invalid) return;

        const formValue = this.form.getRawValue();
        const payload: any = {
            username: formValue.username,
            email: formValue.email,
            phone: formValue.phone || undefined,
            accountStatus: formValue.accountStatus || undefined,
            roleId: undefined,
            profile: {
                firstName: formValue.firstName,
                lastName: formValue.lastName
            }
        };
        if (formValue.password) {
            payload.password = formValue.password;
        }

        this.submitting = true;
        if (!this.viewOnly) {
            this.form.disable();
        }

        if (this.currentId) {
            this.userService.update(this.currentId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: this.translate.instant('common.successful'),
                        detail: this.translate.instant('common.updated', { entity: this.translate.instant('entities.guardian') }),
                        life: 3000
                    });
                    this.dialog = false;
                    this.loadItems(this.meta().page, this.meta().perPage);
                    this.submitting = false;
                    this.form.enable();
                },
                error: () => {
                    this.submitting = false;
                    this.form.enable();
                }
            });
            return;
        }

        this.userService.create(payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translate.instant('common.successful'),
                    detail: this.translate.instant('common.created', { entity: this.translate.instant('entities.guardian') }),
                    life: 3000
                });
                this.dialog = false;
                this.loadItems(this.meta().page, this.meta().perPage);
                this.submitting = false;
                this.form.enable();
            },
            error: () => {
                this.submitting = false;
                this.form.enable();
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        if (page === this.meta().page && perPage === this.meta().perPage) return;
        this.loadItems(page, perPage);
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
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { AuditLogsService } from '@/app/features/audit-logs/services/audit-logs.service';
import { AuditLog, AuditLogsMeta } from '@/app/features/audit-logs/models/audit-log.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    selector: 'app-audit-logs-table',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        InputTextModule,
        ToolbarModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        TranslateModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <div class="font-semibold text-xl">{{ 'pages.audit.title' | translate }}</div>
            </ng-template>
            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="logs()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['method', 'url', 'statusCode', 'ip', 'duration', 'errorMessage', 'actorName', 'createdAt']"
            [tableStyle]="{ 'min-width': '90rem' }"
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
                    <h5 class="m-0">{{ 'pages.audit.logs_title' | translate }}</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" [placeholder]="'common.search' | translate" />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="method" style="min-width: 8rem">
                        {{ 'fields.method' | translate }}
                        <p-sortIcon field="method" />
                    </th>
                    <th pSortableColumn="url" style="min-width: 18rem">
                        {{ 'fields.url' | translate }}
                        <p-sortIcon field="url" />
                    </th>
                    <th pSortableColumn="statusCode" style="min-width: 8rem">
                        {{ 'fields.status_code' | translate }}
                        <p-sortIcon field="statusCode" />
                    </th>
                    <th pSortableColumn="ip" style="min-width: 12rem">
                        {{ 'fields.ip' | translate }}
                        <p-sortIcon field="ip" />
                    </th>
                    <th pSortableColumn="duration" style="min-width: 8rem">
                        {{ 'fields.duration' | translate }}
                        <p-sortIcon field="duration" />
                    </th>
                    <th style="min-width: 20rem">{{ 'fields.error_message' | translate }}</th>
                    <th pSortableColumn="actorName" style="min-width: 12rem">
                        {{ 'fields.actor_name' | translate }}
                        <p-sortIcon field="actorName" />
                    </th>
                    <th pSortableColumn="createdAt" style="min-width: 14rem">
                        {{ 'fields.created_at' | translate }}
                        <p-sortIcon field="createdAt" />
                    </th>
                </tr>
            </ng-template>
            <ng-template #body let-log>
                <tr>
                    <td style="min-width: 8rem">
                        <p-tag [value]="log.method" [severity]="methodSeverity(log.method)"></p-tag>
                    </td>
                    <td style="min-width: 18rem">{{ log.url }}</td>
                    <td style="min-width: 8rem">{{ log.statusCode }}</td>
                    <td style="min-width: 12rem">{{ log.ip }}</td>
                    <td style="min-width: 8rem">{{ log.duration }}</td>
                    <td style="min-width: 20rem">{{ log.errorMessage || '-' }}</td>
                    <td style="min-width: 12rem">{{ log.actorName || '-' }}</td>
                    <td style="min-width: 14rem">{{ log.createdAt | date: 'medium' }}</td>
                </tr>
            </ng-template>
        </p-table>
    `
})
export class AuditLogsTable implements OnInit {
    logs = signal<AuditLog[]>([]);
    meta = signal<AuditLogsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(private auditLogsService: AuditLogsService, private translate: TranslateService) {}

    ngOnInit() {
        this.loadLogs(1, 10);

        this.setColumns();
        this.translate.onLangChange.subscribe(() => this.setColumns());
    }

    loadLogs(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.auditLogsService.list(page, perPage).subscribe({
            next: (res) => {
                this.logs.set(res?.data ?? []);
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

    exportCSV() {
        this.dt.exportCSV();
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadLogs(page, perPage);
    }

    private setColumns() {
        this.cols = [
            { field: 'method', header: this.translate.instant('fields.method') },
            { field: 'url', header: this.translate.instant('fields.url') },
            { field: 'statusCode', header: this.translate.instant('fields.status_code') },
            { field: 'ip', header: this.translate.instant('fields.ip') },
            { field: 'duration', header: this.translate.instant('fields.duration') },
            { field: 'errorMessage', header: this.translate.instant('fields.error_message') },
            { field: 'actorName', header: this.translate.instant('fields.actor_name') },
            { field: 'createdAt', header: this.translate.instant('fields.created_at') }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    methodSeverity(method?: string): 'success' | 'info' | 'warn' | 'danger' | undefined {
        const normalized = (method ?? '').toUpperCase();
        if (normalized === 'GET') return 'info';
        if (normalized === 'POST') return 'success';
        if (normalized === 'PUT' || normalized === 'PATCH') return 'warn';
        if (normalized === 'DELETE') return 'danger';
        return undefined;
    }
}

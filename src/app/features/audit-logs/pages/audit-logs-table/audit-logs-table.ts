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
        TagModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <div class="font-semibold text-xl">Audit Logs</div>
            </ng-template>
            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
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
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} audit logs"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            [totalRecords]="meta().total"
            [lazy]="true"
            (onPage)="onPage($event)"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Logs</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="method" style="min-width: 8rem">
                        Method
                        <p-sortIcon field="method" />
                    </th>
                    <th pSortableColumn="url" style="min-width: 18rem">
                        URL
                        <p-sortIcon field="url" />
                    </th>
                    <th pSortableColumn="statusCode" style="min-width: 8rem">
                        Status
                        <p-sortIcon field="statusCode" />
                    </th>
                    <th pSortableColumn="ip" style="min-width: 12rem">
                        IP
                        <p-sortIcon field="ip" />
                    </th>
                    <th pSortableColumn="duration" style="min-width: 8rem">
                        Duration
                        <p-sortIcon field="duration" />
                    </th>
                    <th style="min-width: 20rem">Error</th>
                    <th pSortableColumn="actorName" style="min-width: 12rem">
                        Actor
                        <p-sortIcon field="actorName" />
                    </th>
                    <th pSortableColumn="createdAt" style="min-width: 14rem">
                        Created At
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

    constructor(private auditLogsService: AuditLogsService) {}

    ngOnInit() {
        this.loadLogs(1, 10);

        this.cols = [
            { field: 'method', header: 'Method' },
            { field: 'url', header: 'URL' },
            { field: 'statusCode', header: 'Status' },
            { field: 'ip', header: 'IP' },
            { field: 'duration', header: 'Duration' },
            { field: 'errorMessage', header: 'Error' },
            { field: 'actorName', header: 'Actor' },
            { field: 'createdAt', header: 'Created At' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
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

    methodSeverity(method?: string): 'success' | 'info' | 'warn' | 'danger' | undefined {
        const normalized = (method ?? '').toUpperCase();
        if (normalized === 'GET') return 'info';
        if (normalized === 'POST') return 'success';
        if (normalized === 'PUT' || normalized === 'PATCH') return 'warn';
        if (normalized === 'DELETE') return 'danger';
        return undefined;
    }
}

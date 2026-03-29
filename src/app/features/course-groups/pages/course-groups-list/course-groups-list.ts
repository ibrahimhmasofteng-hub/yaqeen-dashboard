import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseGroupsListService } from '@/app/features/course-groups/services/course-groups-list.service';
import { CourseGroup, CourseGroupsMeta } from '@/app/features/course-groups/models/course-group.model';

interface Column {
    field: string;
    header: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-course-groups-list',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, ToolbarModule, InputTextModule, IconFieldModule, InputIconModule, TranslateModule],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <div class="font-semibold text-xl">{{ 'pages.groups.manage_title' | translate }}</div>
            </ng-template>
            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="groups()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'courseName', 'courseId']"
            [tableStyle]="{ 'min-width': '75rem' }"
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
                    <h5 class="m-0">{{ 'pages.groups.manage_title' | translate }}</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" [placeholder]="'common.search' | translate" />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="name" style="min-width: 18rem">
                        {{ 'fields.group_name' | translate }}
                        <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="courseName" style="min-width: 16rem">
                        {{ 'entities.course' | translate }}
                        <p-sortIcon field="courseName" />
                    </th>
                    <th style="min-width: 10rem">{{ 'entities.teachers' | translate }}</th>
                    <th style="min-width: 10rem">{{ 'entities.students' | translate }}</th>
                    <th pSortableColumn="createdAt" style="min-width: 14rem">
                        {{ 'fields.created_at' | translate }}
                        <p-sortIcon field="createdAt" />
                    </th>
                </tr>
            </ng-template>
            <ng-template #body let-group>
                <tr>
                    <td style="min-width: 18rem">{{ displayValue(group.name) }}</td>
                    <td style="min-width: 16rem">{{ displayValue(group.courseName || group.course?.name || group.courseId) }}</td>
                    <td style="min-width: 10rem">{{ displayValue(group.teacherCount) }}</td>
                    <td style="min-width: 10rem">{{ displayValue(group.studentCount) }}</td>
                    <td style="min-width: 14rem">{{ group.createdAt ? (group.createdAt | date: 'medium') : '-' }}</td>
                </tr>
            </ng-template>
        </p-table>
    `
})
export class CourseGroupsList implements OnInit {
    groups = signal<CourseGroup[]>([]);
    meta = signal<CourseGroupsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(private groupsService: CourseGroupsListService, private translate: TranslateService) {}

    ngOnInit() {
        this.loadGroups(1, 10);
        this.setColumns();
        this.translate.onLangChange.subscribe(() => this.setColumns());
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    loadGroups(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        this.groupsService.list(page, perPage).subscribe({
            next: (res) => {
                this.groups.set(res?.data ?? []);
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

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadGroups(page, perPage);
    }

    private setColumns() {
        this.cols = [
            { field: 'name', header: this.translate.instant('fields.group_name') },
            { field: 'courseName', header: this.translate.instant('entities.course') },
            { field: 'teacherCount', header: this.translate.instant('entities.teachers') },
            { field: 'studentCount', header: this.translate.instant('entities.students') },
            { field: 'createdAt', header: this.translate.instant('fields.created_at') }
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }
}

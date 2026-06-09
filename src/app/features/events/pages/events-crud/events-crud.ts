import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EventService, EventFilters } from '@/app/features/events/services/event.service';
import { Event as EventModel, EventsMeta, EventStats, EventParticipant } from '@/app/features/events/models/event.model';
import { EventType } from '@/app/features/events/models/event-type.enum';

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
    selector: 'app-events-crud',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        SelectModule,
        TranslateModule,
        TooltipModule,
        TagModule,
        DialogModule,
        AvatarModule,
        ProgressBarModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button [label]="'common.new' | translate" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" [label]="'common.delete' | translate" icon="pi pi-trash" outlined (onClick)="deleteSelectedEvents()" [disabled]="!selectedEvents || !selectedEvents.length" />
            </ng-template>

            <ng-template #end>
                <p-button [label]="'common.export' | translate" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="events()"
            [loading]="loading"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [tableStyle]="{ 'min-width': '80rem' }"
            [(selection)]="selectedEvents"
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
                    <h5 class="m-0">{{ 'pages.events.manage_title' | translate }}</h5>
                    <div class="flex flex-wrap gap-2 items-center">
                        <p-select [options]="eventTypeOptions" [(ngModel)]="filterType" optionLabel="label" optionValue="value" [showClear]="true" [placeholder]="'fields.event_type' | translate" (onChange)="onFilterType($event.value ?? '')" appendTo="body" />
                        <p-select [options]="isActiveOptions" [(ngModel)]="filterIsActive" optionLabel="label" optionValue="value" [showClear]="true" [placeholder]="'common.status' | translate" (onChange)="onFilterIsActive($event.value ?? '')" appendTo="body" />
                        <p-select [options]="isCompletedOptions" [(ngModel)]="filterIsCompleted" optionLabel="label" optionValue="value" [showClear]="true" [placeholder]="'fields.completion' | translate" (onChange)="onFilterIsCompleted($event.value ?? '')" appendTo="body" />
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
                    <th pSortableColumn="name" style="min-width: 16rem">
                        {{ 'fields.event_name' | translate }}
                        <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="type" style="min-width: 12rem">
                        {{ 'fields.event_type' | translate }}
                        <p-sortIcon field="type" />
                    </th>
                    <th pSortableColumn="courseId" style="min-width: 14rem">
                        {{ 'fields.course' | translate }}
                        <p-sortIcon field="courseId" />
                    </th>
                    <th pSortableColumn="startDate" style="min-width: 12rem">
                        {{ 'fields.start_date' | translate }}
                        <p-sortIcon field="startDate" />
                    </th>
                    <th pSortableColumn="endDate" style="min-width: 12rem">
                        {{ 'fields.end_date' | translate }}
                        <p-sortIcon field="endDate" />
                    </th>
                    <th pSortableColumn="pointsRewardAmount" style="min-width: 10rem">
                        {{ 'fields.points_reward' | translate }}
                        <p-sortIcon field="pointsRewardAmount" />
                    </th>
                    <th style="min-width: 10rem">
                        {{ 'common.status' | translate }}
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-event>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="event" />
                    </td>
                    <td style="min-width: 16rem">{{ displayValue(event.name) }}</td>
                    <td style="min-width: 12rem">
                        <p-tag [value]="eventTypeLabel(event.type)" [severity]="event.type === 'Recitations' ? 'info' : 'success'" />
                    </td>
                    <td style="min-width: 14rem">{{ displayValue(event.courseId) }}</td>
                    <td style="min-width: 12rem">{{ event.startDate ? (event.startDate | date:'mediumDate') : '-' }}</td>
                    <td style="min-width: 12rem">{{ event.endDate ? (event.endDate | date:'mediumDate') : '-' }}</td>
                    <td style="min-width: 10rem">{{ displayValue(event.pointsRewardAmount) }}</td>
                    <td style="min-width: 10rem">
                        <p-tag [value]="eventStatusLabel(event)" [severity]="eventSeverity(event)" />
                    </td>
                    <td>
                        <p-button icon="pi pi-chart-bar" class="mr-2" severity="info" [rounded]="true" [outlined]="true" (click)="viewStats(event)" [pTooltip]="'common.view_stats' | translate" tooltipPosition="top" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editEvent(event)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteEvent(event)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-confirmdialog [style]="{ width: '450px' }" />
        <p-toast />

        <p-dialog [(visible)]="statsDialog" [style]="{ width: '700px' }" [header]="'pages.events.stats_title' | translate" [modal]="true">
            <ng-template #content>
                <div *ngIf="statsLoading" class="flex justify-center items-center py-8">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                <div *ngIf="!statsLoading && stats" class="flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="card p-4 surface-ground border-round">
                            <div class="text-surface-500 text-sm mb-1">{{ 'fields.event_type' | translate }}</div>
                            <div class="text-xl font-semibold">{{ eventTypeLabel(stats.eventType) }}</div>
                        </div>
                        <div class="card p-4 surface-ground border-round">
                            <div class="text-surface-500 text-sm mb-1">{{ 'fields.total' | translate }}</div>
                            <div class="text-xl font-semibold">{{ stats.total }}</div>
                        </div>
                        <div class="card p-4 surface-ground border-round">
                            <div class="text-surface-500 text-sm mb-1">{{ 'fields.completed' | translate }}</div>
                            <div class="text-xl font-semibold">{{ stats.completed }}</div>
                        </div>
                        <div class="card p-4 surface-ground border-round">
                            <div class="text-surface-500 text-sm mb-1">{{ 'fields.unique_participants' | translate }}</div>
                            <div class="text-xl font-semibold">{{ stats.uniqueParticipants }}</div>
                        </div>
                    </div>
                    <div *ngIf="participantsLoading" class="flex justify-center items-center py-4">
                        <i class="pi pi-spin pi-spinner text-2xl"></i>
                    </div>
                    <div *ngIf="!participantsLoading && participants.length > 0">
                        <h6 class="mb-3 mt-0">{{ 'pages.events.participants' | translate }}</h6>
                        <div class="flex flex-col gap-3" style="max-height: 320px; overflow-y: auto;">
                            <div *ngFor="let p of participants" class="flex items-center gap-3 p-3 surface-ground border-round">
                                <p-avatar [image]="p.imageUrl" shape="circle" size="large" [pTooltip]="p.studentName" tooltipPosition="top">
                                    <span *ngIf="!p.imageUrl">{{ p.studentName?.charAt(0)?.toUpperCase() }}</span>
                                </p-avatar>
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-medium">{{ p.studentName }}</span>
                                        <p-tag *ngIf="p.qualified" [value]="'common.qualified' | translate" severity="success" />
                                        <p-tag *ngIf="!p.qualified" [value]="'common.not_qualified' | translate" severity="warn" />
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <p-progressBar [value]="p.target > 0 ? (p.completed / p.target) * 100 : 0" [style]="{ height: '6px', flex: '1' }" />
                                        <span class="text-sm text-surface-500 whitespace-nowrap">{{ p.completed }}/{{ p.target }}</span>
                                    </div>
                                </div>
                                <div class="text-center" style="min-width: 2.5rem;">
                                    <div class="text-surface-500 text-xs">#</div>
                                    <div class="font-bold">{{ p.rank }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div *ngIf="!participantsLoading && participants.length === 0 && stats" class="text-center text-surface-500 py-4">
                        {{ 'common.no_data' | translate }}
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="closeStatsDialog()" />
            </ng-template>
        </p-dialog>
    `,
    providers: [MessageService, ConfirmationService]
})
export class EventsCrud implements OnInit {
    events = signal<EventModel[]>([]);
    meta = signal<EventsMeta>({ page: 1, perPage: 10, nextPage: 0, previousPage: 0, total: 0 });
    loading: boolean = false;

    searchTerm: string = '';
    filterType: string = '';
    filterIsActive: string = '';
    filterIsCompleted: string = '';
    currentSort: { field: string; direction: 'asc' | 'desc' } | null = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    eventTypeOptions = [
        { label: 'Recitations', value: 'Recitations' },
        { label: 'Attendances', value: 'Attendances' }
    ];
    isActiveOptions = [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
    ];
    isCompletedOptions = [
        { label: 'Completed', value: 'true' },
        { label: 'Not Completed', value: 'false' }
    ];

    selectedEvents!: EventModel[] | null;

    statsDialog: boolean = false;
    statsLoading: boolean = false;
    stats: EventStats | null = null;
    participants: EventParticipant[] = [];
    participantsLoading: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private eventService: EventService,
        private messageService: MessageService,
        private translate: TranslateService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadEvents(1, 10);
        this.setColumns();
        this.translate.onLangChange.subscribe(() => {
            this.setColumns();
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    loadEvents(page: number, perPage: number) {
        if (this.loading) return;
        this.loading = true;
        const filters: EventFilters = {
            ...(this.searchTerm ? { name: this.searchTerm } : {}),
            ...(this.filterType ? { type: this.filterType as EventType } : {}),
            ...(this.filterIsActive !== '' ? { isActive: this.filterIsActive === 'true' } : {}),
            ...(this.filterIsCompleted !== '' ? { isCompleted: this.filterIsCompleted === 'true' } : {})
        };
        this.eventService.list(page, perPage, filters).subscribe({
            next: (res) => {
                this.events.set(res?.data ?? []);
                this.meta.set(res?.meta ?? { page, perPage, nextPage: 0, previousPage: 0, total: 0 });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement)?.value ?? '';
        this.searchTerm = value;
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadEvents(1, this.meta().perPage), 400);
    }

    onFilterType(value: string) {
        this.filterType = value;
        this.loadEvents(1, this.meta().perPage);
    }

    onFilterIsActive(value: string) {
        this.filterIsActive = value;
        this.loadEvents(1, this.meta().perPage);
    }

    onFilterIsCompleted(value: string) {
        this.filterIsCompleted = value;
        this.loadEvents(1, this.meta().perPage);
    }

    onSort(event: { field: string; order: number }) {
        this.currentSort = event.field ? { field: event.field, direction: event.order === 1 ? 'asc' : 'desc' } : null;
        this.loadEvents(1, this.meta().perPage);
    }

    openNew() {
        this.router.navigate(['/events/new']);
    }

    editEvent(ev: EventModel) {
        this.router.navigate(['/events', ev.id, 'edit']);
    }

    viewStats(ev: EventModel) {
        this.stats = null;
        this.participants = [];
        this.statsDialog = true;
        this.statsLoading = true;
        this.participantsLoading = true;
        const eventId = ev.id as string;

        this.eventService.getStats(eventId).subscribe({
            next: (stats) => {
                this.stats = stats;
                this.statsLoading = false;
            },
            error: () => {
                this.statsLoading = false;
            }
        });

        this.eventService.getParticipants(eventId).subscribe({
            next: (participants) => {
                this.participants = participants ?? [];
                this.participantsLoading = false;
            },
            error: () => {
                this.participantsLoading = false;
            }
        });
    }

    closeStatsDialog() {
        this.statsDialog = false;
    }

    deleteSelectedEvents() {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_selected_confirm', {
                entity: this.translate.instant('entities.events')
            }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedEvents ?? [];
                if (!selected.length) return;
                let remaining = selected.length;
                selected.forEach((ev) => {
                    this.eventService.delete(ev.id as string).subscribe({
                        next: () => {
                            remaining -= 1;
                            if (remaining === 0) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: this.translate.instant('common.successful'),
                                    detail: this.translate.instant('common.deleted_many', {
                                        entity: this.translate.instant('entities.events')
                                    }),
                                    life: 3000
                                });
                                this.selectedEvents = null;
                                this.loadEvents(this.meta().page, this.meta().perPage);
                            }
                        }
                    });
                });
            }
        });
    }

    deleteEvent(ev: EventModel) {
        this.confirmationService.confirm({
            message: this.translate.instant('common.delete_one_confirm', { name: ev.name }),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.eventService.delete(ev.id as string).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translate.instant('common.successful'),
                            detail: this.translate.instant('common.deleted', { entity: this.translate.instant('entities.event') }),
                            life: 3000
                        });
                        this.loadEvents(this.meta().page, this.meta().perPage);
                    }
                });
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        this.loadEvents(page, perPage);
    }

    private setColumns() {
        this.cols = [
            { field: 'name', header: this.translate.instant('fields.event_name') },
            { field: 'type', header: this.translate.instant('fields.event_type') },
            { field: 'courseId', header: this.translate.instant('fields.course') },
            { field: 'startDate', header: this.translate.instant('fields.start_date') },
            { field: 'endDate', header: this.translate.instant('fields.end_date') },
            { field: 'pointsRewardAmount', header: this.translate.instant('fields.points_reward') },
            { field: 'isActive', header: this.translate.instant('common.status') }
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    eventTypeLabel(value?: EventType) {
        if (!value) return '-';
        return this.translate.instant(`enums.event_type.${value}`);
    }

    eventStatusLabel(ev: EventModel) {
        if (ev.isCompleted) return this.translate.instant('common.completed');
        if (ev.isActive) return this.translate.instant('common.active');
        return this.translate.instant('common.inactive');
    }

    eventSeverity(ev: EventModel) {
        if (ev.isCompleted) return 'success';
        if (ev.isActive) return 'info';
        return 'danger';
    }

    displayValue(value: unknown) {
        return value === null || value === undefined || value === '' ? '-' : value;
    }
}

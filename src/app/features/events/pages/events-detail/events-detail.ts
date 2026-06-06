import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { EventService } from '@/app/features/events/services/event.service';
import { Event as EventModel, EventStats, EventProgress } from '@/app/features/events/models/event.model';
import { EventType } from '@/app/features/events/models/event-type.enum';

@Component({
    selector: 'app-events-detail',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TagModule,
        TranslateModule
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ 'pages.events.detail_title' | translate }}</h2>
                <p class="text-surface-500">{{ event()?.name ?? '' }}</p>
            </div>
            <div class="flex gap-2">
                <p-button [label]="'common.edit' | translate" icon="pi pi-pencil" severity="secondary" (onClick)="goToEdit()"></p-button>
                <p-button [label]="'common.cancel' | translate" icon="pi pi-arrow-left" text (onClick)="goBack()"></p-button>
            </div>
        </div>

        <div *ngIf="loading" class="flex justify-center items-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
        </div>

        <ng-container *ngIf="!loading && event()">
            <div class="card mb-6">
                <h3 class="text-lg font-semibold mb-4">{{ 'common.details' | translate }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.event_name' | translate }}</div>
                        <div class="font-semibold">{{ event()?.name ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.event_type' | translate }}</div>
                        <div>
                            <p-tag [value]="eventTypeLabel(event()?.type)" [severity]="event()?.type === 'Recitations' ? 'info' : 'success'" />
                        </div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.course' | translate }}</div>
                        <div class="font-semibold">{{ event()?.courseId ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.points_reward' | translate }}</div>
                        <div class="font-semibold">{{ event()?.pointsRewardAmount ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.target_criteria' | translate }}</div>
                        <div class="font-semibold">{{ event()?.targetCriteria ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'common.status' | translate }}</div>
                        <div>
                            <p-tag [value]="statusLabel()" [severity]="statusSeverity()" />
                        </div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.start_date' | translate }}</div>
                        <div class="font-semibold">{{ event()?.startDate ? (event()!.startDate! | date:'mediumDate') : '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.end_date' | translate }}</div>
                        <div class="font-semibold">{{ event()?.endDate ? (event()!.endDate! | date:'mediumDate') : '-' }}</div>
                    </div>
                    <div>
                        <div class="text-surface-500 text-sm mb-1">{{ 'fields.description' | translate }}</div>
                        <div class="font-semibold">{{ event()?.description || '-' }}</div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="card">
                    <h3 class="text-lg font-semibold mb-4">{{ 'pages.events.stats_title' | translate }}</h3>
                    <div *ngIf="statsLoading" class="flex justify-center py-6">
                        <i class="pi pi-spin pi-spinner text-xl"></i>
                    </div>
                    <div *ngIf="!statsLoading && stats" class="grid grid-cols-3 gap-4">
                        <div class="text-center p-4 surface-ground border-round">
                            <div class="text-2xl font-bold text-primary">{{ stats.total }}</div>
                            <div class="text-surface-500 text-sm mt-1">{{ 'fields.total' | translate }}</div>
                        </div>
                        <div class="text-center p-4 surface-ground border-round">
                            <div class="text-2xl font-bold" style="color: #056937;">{{ stats.completed }}</div>
                            <div class="text-surface-500 text-sm mt-1">{{ 'fields.completed' | translate }}</div>
                        </div>
                        <div class="text-center p-4 surface-ground border-round">
                            <div class="text-2xl font-bold" style="color: #e67e22;">{{ stats.uniqueParticipants }}</div>
                            <div class="text-surface-500 text-sm mt-1">{{ 'fields.unique_participants' | translate }}</div>
                        </div>
                    </div>
                    <div *ngIf="!statsLoading && !stats" class="text-surface-500 text-center py-4">{{ 'common.no_data' | translate }}</div>
                </div>

                <div class="card">
                    <h3 class="text-lg font-semibold mb-4">{{ 'pages.events.my_progress' | translate }}</h3>
                    <div *ngIf="progressLoading" class="flex justify-center py-6">
                        <i class="pi pi-spin pi-spinner text-xl"></i>
                    </div>
                    <div *ngIf="!progressLoading && progress" class="flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-500">{{ 'fields.completed' | translate }}</span>
                            <span class="font-semibold">{{ progress.completed }} / {{ progress.total }}</span>
                        </div>
                        <div class="surface-border border-round" style="height: 12px; overflow: hidden;">
                            <div [style.width]="progressPercent() + '%'" style="height: 100%; background: #056937; border-radius: 6px; transition: width 0.3s;"></div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-surface-500 text-sm">{{ 'fields.target_criteria' | translate }}: {{ progress.targetCriteria }}</span>
                            <p-tag *ngIf="progress.isQualified" [value]="'common.qualified' | translate" severity="success" />
                            <p-tag *ngIf="!progress.isQualified" [value]="'common.not_qualified' | translate" severity="warn" />
                        </div>
                    </div>
                    <div *ngIf="!progressLoading && !progress" class="text-surface-500 text-center py-4">{{ 'common.no_data' | translate }}</div>
                </div>
            </div>
        </ng-container>
    `
})
export class EventsDetail implements OnInit {
    event = signal<EventModel | null>(null);
    stats: EventStats | null = null;
    progress: EventProgress | null = null;
    progressPercent = signal<number>(0);

    loading = false;
    statsLoading = false;
    progressLoading = false;

    private eventId?: string;

    constructor(
        private eventService: EventService,
        private translate: TranslateService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.eventId = id;
                this.loadEvent(id);
                this.loadStats(id);
                this.loadProgress(id);
            }
        });
    }

    loadEvent(id: string) {
        this.loading = true;
        this.eventService.get(id).subscribe({
            next: (ev) => {
                this.event.set(ev);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadStats(id: string) {
        this.statsLoading = true;
        this.eventService.getStats(id).subscribe({
            next: (stats) => {
                this.stats = stats;
                this.statsLoading = false;
            },
            error: () => {
                this.statsLoading = false;
            }
        });
    }

    loadProgress(id: string) {
        this.progressLoading = true;
        this.eventService.getMyProgress(id).subscribe({
            next: (progress) => {
                this.progress = progress;
                const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
                this.progressPercent.set(pct);
                this.progressLoading = false;
            },
            error: () => {
                this.progressLoading = false;
            }
        });
    }

    goToEdit() {
        if (!this.eventId) return;
        this.router.navigate(['/events', this.eventId, 'edit']);
    }

    goBack() {
        this.router.navigate(['/events']);
    }

    eventTypeLabel(value?: EventType) {
        if (!value) return '-';
        return this.translate.instant(`enums.event_type.${value}`);
    }

    statusLabel() {
        const ev = this.event();
        if (!ev) return '-';
        if (ev.isCompleted) return this.translate.instant('common.completed');
        if (ev.isActive) return this.translate.instant('common.active');
        return this.translate.instant('common.inactive');
    }

    statusSeverity() {
        const ev = this.event();
        if (!ev) return 'info';
        if (ev.isCompleted) return 'success';
        if (ev.isActive) return 'info';
        return 'danger';
    }
}

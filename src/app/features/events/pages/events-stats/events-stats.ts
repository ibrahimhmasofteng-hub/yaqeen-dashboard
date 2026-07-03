import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { EventService } from '@/app/features/events/services/event.service';
import { Event as EventModel, EventStats, EventParticipant } from '@/app/features/events/models/event.model';
import { EventType } from '@/app/features/events/models/event-type.enum';

@Component({
    selector: 'app-events-stats',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        CardModule,
        ProgressBarModule,
        PaginatorModule,
        SkeletonModule,
        TranslateModule
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ 'pages.events.stats_title' | translate }}</h2>
                <p class="text-surface-500">{{ event()?.name ?? '' }}</p>
            </div>
            <div class="flex gap-2">
                <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" text (onClick)="goBack()" />
            </div>
        </div>

        <div *ngIf="loading" class="flex justify-center items-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
        </div>

        <ng-container *ngIf="!loading">
            <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div *ngIf="statsLoading" class="card p-4">
                    <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                    <p-skeleton width="60%" height="1.5rem" />
                </div>
                <div *ngIf="statsLoading" class="card p-4">
                    <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                    <p-skeleton width="60%" height="1.5rem" />
                </div>
                <div *ngIf="statsLoading" class="card p-4">
                    <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                    <p-skeleton width="60%" height="1.5rem" />
                </div>
                <div *ngIf="statsLoading" class="card p-4">
                    <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                    <p-skeleton width="60%" height="1.5rem" />
                </div>

                <div *ngIf="!statsLoading && stats" class="card p-5 surface-ground border-round">
                    <div class="text-surface-500 text-sm mb-2">{{ 'fields.event_type' | translate }}</div>
                    <div class="text-xl font-semibold">{{ eventTypeLabel(stats.eventType) }}</div>
                </div>
                <div *ngIf="!statsLoading && stats" class="card p-5 surface-ground border-round">
                    <div class="text-surface-500 text-sm mb-2">{{ 'fields.total' | translate }}</div>
                    <div class="text-2xl font-bold" style="color: #056937;">{{ stats.total }}</div>
                </div>
                <div *ngIf="!statsLoading && stats" class="card p-5 surface-ground border-round">
                    <div class="text-surface-500 text-sm mb-2">{{ 'fields.completed' | translate }}</div>
                    <div class="text-2xl font-bold" style="color: #22c55e;">{{ stats.completed }}</div>
                </div>
                <div *ngIf="!statsLoading && stats" class="card p-5 surface-ground border-round">
                    <div class="text-surface-500 text-sm mb-2">{{ 'fields.unique_participants' | translate }}</div>
                    <div class="text-2xl font-bold" style="color: #e67e22;">{{ stats.uniqueParticipants }}</div>
                </div>
            </div>

            <div class="card">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold m-0">{{ 'pages.events.participants' | translate }}</h3>
                    <span *ngIf="!participantsLoading && participantsMeta().total > 0" class="text-surface-500 text-sm">{{ participantsMeta().total }} {{ 'pages.events.participants' | translate | lowercase }}</span>
                </div>

                <div *ngIf="participantsLoading" class="flex flex-col gap-4">
                    <div *ngFor="let s of [1,2,3,4,5]" class="flex items-center gap-3">
                        <p-skeleton shape="circle" size="3rem" />
                        <div class="flex-1">
                            <p-skeleton width="50%" height="1rem" styleClass="mb-2" />
                            <p-skeleton width="80%" height="0.5rem" />
                        </div>
                    </div>
                </div>

                <div *ngIf="!participantsLoading && participantsMeta().total === 0" class="text-center text-surface-500 py-8">
                    {{ 'common.no_data' | translate }}
                </div>

                <div *ngIf="!participantsLoading && participantsMeta().total > 0">
                    <div class="flex flex-col gap-3">
                        <div *ngFor="let p of participants(); trackBy: trackParticipant" class="flex items-center gap-4 p-3 border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-200">
                            <div class="flex items-center justify-center font-bold text-lg" style="min-width: 2rem; color: #056937;">
                                {{ p.rank }}
                            </div>
                            <p-avatar [image]="p.imageUrl || undefined" shape="circle" size="large">
                                <span *ngIf="!p.imageUrl">{{ p.studentName?.charAt(0)?.toUpperCase() }}</span>
                            </p-avatar>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <span class="font-medium truncate">{{ p.studentName }}</span>
                                    <p-tag *ngIf="p.qualified" [value]="'common.qualified' | translate" severity="success" />
                                    <p-tag *ngIf="!p.qualified" [value]="'common.not_qualified' | translate" severity="warn" />
                                </div>
                                <div class="flex items-center gap-3">
                                    <p-progressBar [value]="p.target > 0 ? (p.completed / p.target) * 100 : 0" [style]="{ height: '8px', flex: '1' }" [showValue]="false" />
                                    <span class="text-sm text-surface-500 whitespace-nowrap font-medium">{{ p.completed }} / {{ p.target }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p-paginator
                        [rows]="participantsMeta().perPage"
                        [totalRecords]="participantsMeta().total"
                        [rowsPerPageOptions]="[10, 20, 30]"
                        [currentPageReportTemplate]="'common.page_report' | translate"
                        [showCurrentPageReport]="true"
                        (onPage)="handlePageChange($event)"
                    />
                </div>
            </div>
        </ng-container>
    `
})
export class EventsStats implements OnInit {
    event = signal<EventModel | null>(null);
    stats: EventStats | null = null;
    participants = signal<EventParticipant[]>([]);
    participantsMeta = signal<{ page: number; perPage: number; total: number }>({ page: 1, perPage: 10, total: 0 });

    loading = false;
    statsLoading = false;
    participantsLoading = false;

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
                this.loadParticipants(1, 10);
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
                if (this.participants().length > 0) {
                    this.participantsMeta.update((m) => ({ ...m, total: stats.uniqueParticipants }));
                }
            },
            error: () => {
                this.statsLoading = false;
            }
        });
    }

    loadParticipants(page: number, perPage: number) {
        if (!this.eventId) return;
        this.participantsLoading = true;
        this.eventService.getParticipants(this.eventId, page, perPage).subscribe({
            next: (participants: EventParticipant[]) => {
                this.participants.set(participants ?? []);
                this.participantsMeta.set({
                    page,
                    perPage,
                    total: this.stats?.uniqueParticipants ?? participants?.length ?? 0
                });
                this.participantsLoading = false;
            },
            error: () => {
                this.participantsLoading = false;
            }
        });
    }

    handlePageChange(event: { first?: number; rows?: number } | any) {
        const page = Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1;
        const perPage = event.rows ?? 10;
        this.loadParticipants(page, perPage);
    }

    goBack() {
        this.router.navigate(['/events']);
    }

    eventTypeLabel(value?: EventType) {
        if (!value) return '-';
        return this.translate.instant(`enums.event_type.${value}`);
    }

    trackParticipant(_index: number, item: EventParticipant) {
        return item.studentId;
    }
}

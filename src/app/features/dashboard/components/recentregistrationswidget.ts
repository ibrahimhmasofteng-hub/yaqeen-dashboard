import { Component, Input } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardData } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-recent-registrations-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, TranslateModule],
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">{{ 'dashboard.recent_registrations' | translate }}</div>
        <p-table [value]="data?.recentRegistrations ?? []" [paginator]="true" [rows]="5" responsiveLayout="scroll">
            <ng-template #header>
                <tr>
                    <th pSortableColumn="name">{{ 'fields.name' | translate }} <p-sortIcon field="name"></p-sortIcon></th>
                    <th pSortableColumn="role">{{ 'fields.role' | translate }} <p-sortIcon field="role"></p-sortIcon></th>
                    <th pSortableColumn="createdAt">{{ 'fields.created_at' | translate }} <p-sortIcon field="createdAt"></p-sortIcon></th>
                    <th>{{ 'common.actions' | translate }}</th>
                </tr>
            </ng-template>
            <ng-template #body let-actor>
                <tr>
                    <td style="min-width: 10rem;">{{ actor.name }}</td>
                    <td style="min-width: 8rem;">{{ ('dashboard.roles.' + actor.roleKey) | translate }}</td>
                    <td style="min-width: 10rem;">{{ actor.createdAt }}</td>
                    <td style="width: 15%;">
                        <button pButton pRipple type="button" icon="pi pi-eye" class="p-button p-component p-button-text p-button-icon-only"></button>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class RecentRegistrationsWidget {
    @Input() data: DashboardData | null = null;
}

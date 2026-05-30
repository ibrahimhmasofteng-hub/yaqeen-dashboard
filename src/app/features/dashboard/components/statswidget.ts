import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardData } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule, TranslateModule],
    template: `<div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.students' | translate }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ data?.summary?.studentsTotal | number }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-blue-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+{{ data?.summary?.studentsDeltaMonth }} </span>
                <span class="text-muted-color">{{ 'dashboard.this_month' | translate }}</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.teachers' | translate }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ data?.summary?.teachersTotal | number }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-briefcase text-orange-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+{{ data?.summary?.teachersDeltaMonth }} </span>
                <span class="text-muted-color">{{ 'dashboard.this_month' | translate }}</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.courses' | translate }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ data?.summary?.coursesTotal | number }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-book text-cyan-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+{{ data?.summary?.coursesDeltaMonth }} </span>
                <span class="text-muted-color">{{ 'dashboard.this_month' | translate }}</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.groups' | translate }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ data?.summary?.groupsTotal | number }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-sitemap text-purple-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+{{ data?.summary?.groupsDeltaMonth }} </span>
                <span class="text-muted-color">{{ 'dashboard.this_month' | translate }}</span>
            </div>
        </div>`
})
export class StatsWidget {
    @Input() data: DashboardData | null = null;
}

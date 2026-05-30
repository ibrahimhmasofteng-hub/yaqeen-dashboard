import { Component, OnInit, inject, signal } from '@angular/core';
import { StatsWidget } from './components/statswidget.js';
import { RecentRegistrationsWidget } from './components/recentregistrationswidget.js';
import { TopCoursesWidget } from './components/topcourseswidget.js';
import { MonthlyGrowthWidget } from './components/monthlygrowthwidget.js';
import { DashboardService, DashboardData } from './services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [StatsWidget, RecentRegistrationsWidget, TopCoursesWidget, MonthlyGrowthWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" [data]="data()" />
            <div class="col-span-12 xl:col-span-6">
                <app-recent-registrations-widget [data]="data()" />
                <app-top-courses-widget [data]="data()" />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-monthly-growth-widget [data]="data()" />
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    private dashboardService = inject(DashboardService);

    data = signal<DashboardData | null>(null);

    ngOnInit() {
        this.dashboardService.getDashboard().subscribe({
            next: (data) => this.data.set(data),
            error: (err) => console.error('Error loading dashboard:', err)
        });
    }
}

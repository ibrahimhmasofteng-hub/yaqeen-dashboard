import { Component } from '@angular/core';
import { StatsWidget } from './components/statswidget.js';
import { AlertsRemindersWidget } from './components/alertsreminderswidget.js';
import { RecentRegistrationsWidget } from './components/recentregistrationswidget.js';
import { TopCoursesWidget } from './components/topcourseswidget.js';
import { MonthlyGrowthWidget } from './components/monthlygrowthwidget.js';

@Component({
    selector: 'app-dashboard',
    imports: [StatsWidget, RecentRegistrationsWidget, TopCoursesWidget, MonthlyGrowthWidget, AlertsRemindersWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-recent-registrations-widget />
                <app-top-courses-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-monthly-growth-widget />
                <app-alerts-reminders-widget />
            </div>
        </div>
    `
})
export class Dashboard {}

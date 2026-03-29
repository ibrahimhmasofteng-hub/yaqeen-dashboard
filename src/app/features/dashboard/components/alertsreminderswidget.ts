import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    standalone: true,
    selector: 'app-alerts-reminders-widget',
    imports: [ButtonModule, MenuModule, TranslateModule],
    template: `<div class="card">
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">{{ 'dashboard.alerts_reminders' | translate }}</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>

        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.today' | translate }}</span>
        <ul class="p-0 mx-0 mt-0 mb-6 list-none">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-exclamation-triangle text-xl! text-blue-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >{{ 'dashboard.alert_course_end_prefix' | translate }}
                    <span class="text-primary font-bold">Noor Al-Quran</span>
                    <span class="text-surface-700 dark:text-surface-100">{{ 'dashboard.alert_course_end_suffix' | translate: { days: 5 } }}</span>
                </span>
            </li>
            <li class="flex items-center py-2">
                <div class="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-user-plus text-xl! text-orange-500"></i>
                </div>
                <span class="text-surface-700 dark:text-surface-100 leading-normal">{{ 'dashboard.alert_new_students' | translate: { count: 12 } }}</span>
            </li>
        </ul>

        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.yesterday' | translate }}</span>
        <ul class="p-0 m-0 list-none mb-6">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-users text-xl! text-blue-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >{{ 'dashboard.alert_group_teacher_prefix' | translate }}
                    <span class="text-primary font-bold">Al-Fatiha</span>
                    <span class="text-surface-700 dark:text-surface-100">{{ 'dashboard.alert_group_teacher_suffix' | translate: { count: 0 } }}</span>
                </span>
            </li>
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-pink-100 dark:bg-pink-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-ban text-xl! text-pink-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">{{ 'dashboard.alert_blocked_accounts' | translate: { count: 3 } }}</span>
            </li>
        </ul>
        <span class="block text-muted-color font-medium mb-4">{{ 'dashboard.last_week' | translate }}</span>
        <ul class="p-0 m-0 list-none">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-chart-line text-xl! text-green-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">{{ 'dashboard.alert_groups_growth' | translate: { percent: 12 } }}</span>
            </li>
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-book text-xl! text-purple-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">{{ 'dashboard.alert_new_courses' | translate: { count: 4 } }}</span>
            </li>
        </ul>
    </div>`
})
export class AlertsRemindersWidget {
    items = [
        { label: 'Add New', icon: 'pi pi-fw pi-plus' },
        { label: 'Remove', icon: 'pi pi-fw pi-trash' }
    ];
}

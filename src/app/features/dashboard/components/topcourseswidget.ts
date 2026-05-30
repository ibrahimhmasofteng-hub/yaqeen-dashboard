import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardData } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-top-courses-widget',
    imports: [CommonModule, ButtonModule, MenuModule, TranslateModule],
    template: ` <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">{{ 'dashboard.top_courses' | translate }}</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>
        <ul class="list-none p-0 m-0">
            @for (course of data?.topCourses ?? []; track course.id; let i = $index) {
                <li class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <span class="text-surface-900 dark:text-surface-0 font-medium mb-1 md:mb-0" style="margin-inline-end: 0.5rem;">{{ course.name }}</span>
                        <div class="mt-1 text-muted-color">{{ course.typeKey | translate }}</div>
                    </div>
                    <div class="mt-2 md:mt-0 flex items-center gap-4">
                        <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-40 lg:w-24" style="height: 8px">
                            <div class="h-full" [ngClass]="colorAt(i).bar" [style.width.%]="course.progress"></div>
                        </div>
                        <span class="font-medium" [ngClass]="colorAt(i).text" style="min-width: 3rem; text-align: end;">{{ course.students | number }}</span>
                    </div>
                </li>
            } @empty {
                <li class="text-muted-color">{{ 'common.no_records' | translate }}</li>
            }
        </ul>
    </div>`
})
export class TopCoursesWidget {
    @Input() data: DashboardData | null = null;

    private readonly palette = [
        { bar: 'bg-orange-500', text: 'text-orange-500' },
        { bar: 'bg-cyan-500', text: 'text-cyan-500' },
        { bar: 'bg-pink-500', text: 'text-pink-500' },
        { bar: 'bg-green-500', text: 'text-green-500' },
        { bar: 'bg-purple-500', text: 'text-purple-500' },
        { bar: 'bg-teal-500', text: 'text-teal-500' }
    ];

    items = [
        { label: 'Add New', icon: 'pi pi-fw pi-plus' },
        { label: 'Remove', icon: 'pi pi-fw pi-trash' }
    ];

    colorAt(index: number) {
        return this.palette[index % this.palette.length];
    }
}

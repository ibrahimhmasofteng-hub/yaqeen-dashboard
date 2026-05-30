import { afterNextRender, Component, Input, OnChanges, effect, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '@/app/layout/service/layout.service';
import { TranslateService } from '@ngx-translate/core';
import { DashboardData } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-monthly-growth-widget',
    imports: [ChartModule, TranslateModule],
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">{{ 'dashboard.monthly_growth' | translate }}</div>
        <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" class="h-100" />
    </div>`
})
export class MonthlyGrowthWidget implements OnChanges {
    layoutService = inject(LayoutService);
    translate = inject(TranslateService);

    @Input() data: DashboardData | null = null;

    chartData = signal<any>(null);
    chartOptions = signal<any>(null);

    constructor() {
        afterNextRender(() => {
            setTimeout(() => this.initChart(), 150);
        });

        effect(() => {
            this.layoutService.layoutConfig().darkTheme;
            setTimeout(() => this.initChart(), 150);
        });

        this.translate.onLangChange.subscribe(() => {
            setTimeout(() => this.initChart(), 150);
        });
    }

    ngOnChanges() {
        if (this.data) this.initChart();
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');
        const growth = this.data?.monthlyGrowth;

        this.chartData.set({
            labels: growth?.labels ?? [],
            datasets: [
                {
                    type: 'bar',
                    label: this.translate.instant('dashboard.students'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                    data: growth?.students ?? [],
                    barThickness: 24
                },
                {
                    type: 'bar',
                    label: this.translate.instant('dashboard.groups'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                    data: growth?.groups ?? [],
                    barThickness: 24
                },
                {
                    type: 'bar',
                    label: this.translate.instant('dashboard.courses'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                    data: growth?.courses ?? [],
                    borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
                    borderSkipped: false,
                    barThickness: 24
                }
            ]
        });

        this.chartOptions.set({
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: textMutedColor },
                    grid: { color: 'transparent', borderColor: 'transparent' }
                },
                y: {
                    stacked: true,
                    ticks: { color: textMutedColor },
                    grid: { color: borderColor, borderColor: 'transparent', drawTicks: false }
                }
            }
        });
    }
}

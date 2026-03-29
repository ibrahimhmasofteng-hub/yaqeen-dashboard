import { afterNextRender, Component, effect, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '@/app/layout/service/layout.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    standalone: true,
    selector: 'app-monthly-growth-widget',
    imports: [ChartModule, TranslateModule],
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">{{ 'dashboard.monthly_growth' | translate }}</div>
        <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" class="h-100" />
    </div>`
})
export class MonthlyGrowthWidget {
    layoutService = inject(LayoutService);
    translate = inject(TranslateService);

    chartData = signal<any>(null);

    chartOptions = signal<any>(null);

    constructor() {
        afterNextRender(() => {
            setTimeout(() => {
                this.initChart();
            }, 150);
        });

        effect(() => {
            this.layoutService.layoutConfig().darkTheme;
            setTimeout(() => {
                this.initChart();
            }, 150);
        });
        this.translate.onLangChange.subscribe(() => {
            setTimeout(() => {
                this.initChart();
            }, 150);
        });
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        this.chartData.set({
            labels: [
                this.translate.instant('dashboard.months.jan'),
                this.translate.instant('dashboard.months.feb'),
                this.translate.instant('dashboard.months.mar'),
                this.translate.instant('dashboard.months.apr'),
                this.translate.instant('dashboard.months.may'),
                this.translate.instant('dashboard.months.jun')
            ],
            datasets: [
                {
                    type: 'bar',
                    label: this.translate.instant('dashboard.students'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                    data: [40, 55, 62, 58, 71, 80],
                    barThickness: 24
                },
                {
                    type: 'bar',
                    label: this.translate.instant('dashboard.groups'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                    data: [6, 7, 9, 8, 10, 12],
                    barThickness: 24
                },
                {
                    type: 'bar',
                    label: this.translate.instant('dashboard.courses'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                    data: [1, 2, 2, 3, 3, 4],
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                    barThickness: 24
                }
            ]
        });

        this.chartOptions.set({
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false
                    }
                }
            }
        });
    }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RecommendationService } from '@/app/features/recommendations/services/recommendation.service';
import {
    RecommendationResponseDTO,
    JuzzTestResponseDTO,
    PageRecommendationDTO,
    SurahTestRecommendationDTO
} from '@/app/features/recommendations/models/recommendation.model';
import { CourseService } from '@/app/features/courses/services/course.service';
import { Course } from '@/app/features/courses/models/course.model';
import { StudentService } from '@/app/features/students/services/student.service';
import { Student } from '@/app/features/students/models/student.model';
import { NotificationService } from '@/app/core/services/notification.service';

type RecTab = 'recommendations' | 'juzz-test';

@Component({
    selector: 'app-recommendations-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        SelectModule,
        TabsModule,
        TagModule,
        CardModule,
        PanelModule,
        ToolbarModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        ProgressSpinnerModule,
        TranslateModule
    ],
    providers: [ConfirmationService],
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">{{ 'pages.recommendations.title' | translate }}</div>

            <div class="flex flex-wrap items-end gap-4 mb-6">
                <div class="flex-1 min-w-[16rem]">
                    <label class="block font-bold mb-2">{{ 'entities.courses' | translate }} <span class="text-red-500">*</span></label>
                    <p-select
                        [options]="courseOptions"
                        optionLabel="label"
                        optionValue="value"
                        [(ngModel)]="selectedCourseId"
                        appendTo="body"
                        [placeholder]="'common.select_course' | translate"
                        [showClear]="true"
                        (onChange)="onCourseChange()"
                        styleClass="w-full"
                        [disabled]="loading"
                    />
                </div>
                <div class="flex-1 min-w-[16rem]">
                    <label class="block font-bold mb-2">{{ 'entities.student' | translate }} <span class="text-red-500">*</span></label>
                    <p-select
                        [options]="studentOptions"
                        optionLabel="label"
                        optionValue="value"
                        [(ngModel)]="selectedStudentId"
                        appendTo="body"
                        [placeholder]="'pages.recommendations.select_student' | translate"
                        [showClear]="true"
                        (onChange)="onStudentChange()"
                        [filter]="true"
                        filterBy="label"
                        styleClass="w-full"
                        [disabled]="loading || !selectedCourseId"
                    />
                </div>
                <div>
                    <p-button
                        [label]="'pages.recommendations.send' | translate"
                        icon="pi pi-send"
                        severity="success"
                        (onClick)="sendRecommendation()"
                        [disabled]="!selectedStudentId || !selectedCourseId"
                        [loading]="sending"
                    />
                </div>
            </div>

            @if (loading) {
                <div class="flex justify-content-center py-8">
                    <p-progressSpinner />
                </div>
            } @else if (selectedCourseId && selectedStudentId) {
                <p-tabs [value]="activeTab" (valueChange)="onTabChange($event)">
                    <p-tablist>
                        <p-tab value="recommendations">{{ 'pages.recommendations.tab_recommendations' | translate }}</p-tab>
                        <p-tab value="juzz-test">{{ 'pages.recommendations.tab_juzz_test' | translate }}</p-tab>
                    </p-tablist>
                    <p-tabpanels>
                        <p-tabpanel value="recommendations">
                            @if (recommendation()) {
                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
                                    <p-panel [header]="'pages.recommendations.pages_to_review' | translate" [toggleable]="true">
                                        <ng-template #content>
                                            @if (recommendation()!.pagesToReview.length === 0) {
                                                <div class="text-surface-500 py-4">{{ 'common.no_data' | translate }}</div>
                                            } @else {
                                                <p-table [value]="recommendation()!.pagesToReview" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '20rem' }">
                                                    <ng-template #header>
                                                        <tr>
                                                            <th>{{ 'pages.recommendations.page' | translate }}</th>
                                                            <th>{{ 'pages.recommendations.reason' | translate }}</th>
                                                            <th>{{ 'pages.recommendations.priority' | translate }}</th>
                                                        </tr>
                                                    </ng-template>
                                                    <ng-template #body let-item>
                                                        <tr>
                                                            <td>{{ item.page }}</td>
                                                            <td>{{ item.reason }}</td>
                                                            <td><p-tag [value]="priorityLabel(item.priority)" [severity]="prioritySeverity(item.priority)" /></td>
                                                        </tr>
                                                    </ng-template>
                                                </p-table>
                                            }
                                        </ng-template>
                                    </p-panel>

                                    <p-panel [header]="'pages.recommendations.pages_to_memorize' | translate" [toggleable]="true">
                                        <ng-template #content>
                                            @if (recommendation()!.pagesToMemorize.length === 0) {
                                                <div class="text-surface-500 py-4">{{ 'common.no_data' | translate }}</div>
                                            } @else {
                                                <p-table [value]="recommendation()!.pagesToMemorize" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '20rem' }">
                                                    <ng-template #header>
                                                        <tr>
                                                            <th>{{ 'pages.recommendations.page' | translate }}</th>
                                                            <th>{{ 'pages.recommendations.reason' | translate }}</th>
                                                            <th>{{ 'pages.recommendations.priority' | translate }}</th>
                                                        </tr>
                                                    </ng-template>
                                                    <ng-template #body let-item>
                                                        <tr>
                                                            <td>{{ item.page }}</td>
                                                            <td>{{ item.reason }}</td>
                                                            <td><p-tag [value]="priorityLabel(item.priority)" [severity]="prioritySeverity(item.priority)" /></td>
                                                        </tr>
                                                    </ng-template>
                                                </p-table>
                                            }
                                        </ng-template>
                                    </p-panel>

                                    <p-panel [header]="'pages.recommendations.error_summary' | translate" [toggleable]="true">
                                        <ng-template #content>
                                            @if (recommendation()!.errorTypeSummary.length === 0) {
                                                <div class="text-surface-500 py-4">{{ 'common.no_data' | translate }}</div>
                                            } @else {
                                                <div class="flex flex-wrap gap-3">
                                                    @for (err of recommendation()!.errorTypeSummary; track err.type) {
                                                        <div class="card flex flex-col items-center gap-2 px-6 py-4">
                                                            <div class="text-3xl font-bold text-primary">{{ err.count }}</div>
                                                            <div class="text-sm text-surface-500">{{ err.type }}</div>
                                                        </div>
                                                    }
                                                </div>
                                            }
                                        </ng-template>
                                    </p-panel>

                                    <p-panel [header]="'pages.recommendations.weak_surahs' | translate" [toggleable]="true">
                                        <ng-template #content>
                                            @if (recommendation()!.weakSurahs.length === 0) {
                                                <div class="text-surface-500 py-4">{{ 'common.no_data' | translate }}</div>
                                            } @else {
                                                <p-table [value]="recommendation()!.weakSurahs" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '20rem' }">
                                                    <ng-template #header>
                                                        <tr>
                                                            <th>{{ 'pages.recommendations.surah' | translate }}</th>
                                                            <th>{{ 'pages.recommendations.error_count' | translate }}</th>
                                                        </tr>
                                                    </ng-template>
                                                    <ng-template #body let-item>
                                                        <tr>
                                                            <td>{{ item.surahArabicName || item.surahName }}</td>
                                                            <td><p-tag [value]="item.errorCount" severity="danger" /></td>
                                                        </tr>
                                                    </ng-template>
                                                </p-table>
                                            }
                                        </ng-template>
                                    </p-panel>
                                </div>
                            } @else if (!loading) {
                                <div class="text-surface-500 py-8 text-center">{{ 'common.no_data' | translate }}</div>
                            }
                        </p-tabpanel>

                        <p-tabpanel value="juzz-test">
                            @if (juzzTest()) {
                                <div class="mt-4">
                                    <div class="flex items-center gap-4 mb-4">
                                        <p-card>
                                            <ng-template #content>
                                                <div class="text-center">
                                                    <div class="text-3xl font-bold text-orange-500">{{ juzzTest()!.totalErrorsFound }}</div>
                                                    <div class="text-sm text-surface-500 mt-1">{{ 'pages.recommendations.total_errors' | translate }}</div>
                                                </div>
                                            </ng-template>
                                        </p-card>
                                    </div>

                                    @if (juzzTest()!.recommendations.length === 0) {
                                        <div class="text-surface-500 py-8 text-center">{{ 'common.no_data' | translate }}</div>
                                    } @else {
                                        <p-table
                                            [value]="juzzTest()!.recommendations"
                                            styleClass="p-datatable-sm"
                                            [tableStyle]="{ 'min-width': '40rem' }"
                                            [expandedRowKeys]="expandedSurahIds()"
                                            dataKey="surahId"
                                        >
                                            <ng-template #header>
                                                <tr>
                                                    <th style="width: 3rem"></th>
                                                    <th>{{ 'pages.recommendations.surah' | translate }}</th>
                                                    <th>{{ 'pages.recommendations.total_errors' | translate }}</th>
                                                    <th>{{ 'pages.recommendations.priority_score' | translate }}</th>
                                                    <th>{{ 'pages.recommendations.ayah_count' | translate }}</th>
                                                </tr>
                                            </ng-template>
                                            <ng-template #body let-item let-expanded="expanded">
                                                <tr>
                                                    <td>
                                                        <p-button
                                                            [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                                                            [text]="true"
                                                            [rounded]="true"
                                                            [pRowToggler]="item"
                                                        />
                                                    </td>
                                                    <td>{{ item.surahArabicName || item.surahName }}</td>
                                                    <td><p-tag [value]="item.totalErrors" [severity]="item.totalErrors > 5 ? 'danger' : item.totalErrors > 2 ? 'warn' : 'success'" /></td>
                                                    <td>
                                                        <div class="flex items-center gap-2">
                                                            <div class="surface-300 border-round" style="height: 8px; width: 100px; position: relative;">
                                                                <div class="border-round" [style]="{ height: '8px', width: getPriorityWidth(item.priorityScore) + '%', background: getPriorityColor(item.priorityScore) }"></div>
                                                            </div>
                                                            <span class="font-semibold">{{ item.priorityScore }}</span>
                                                        </div>
                                                    </td>
                                                    <td>{{ item.ayahCount }}</td>
                                                </tr>
                                            </ng-template>
                                            <ng-template #expansion let-item>
                                                <tr>
                                                    <td colspan="5">
                                                        <div class="p-4">
                                                            <h6 class="m-0 mb-3">{{ 'pages.recommendations.problematic_verses' | translate }}</h6>
                                                            @if (item.problematicVerses.length === 0) {
                                                                <div class="text-surface-500">{{ 'common.no_data' | translate }}</div>
                                                            } @else {
                                                                <p-table [value]="item.problematicVerses" styleClass="p-datatable-sm">
                                                                    <ng-template #header>
                                                                        <tr>
                                                                            <th>{{ 'pages.recommendations.verse_number' | translate }}</th>
                                                                            <th>{{ 'pages.recommendations.page' | translate }}</th>
                                                                            <th>{{ 'pages.recommendations.error_count' | translate }}</th>
                                                                        </tr>
                                                                    </ng-template>
                                                                    <ng-template #body let-verse>
                                                                        <tr>
                                                                            <td>{{ verse.verseNumber }}</td>
                                                                            <td>{{ verse.page }}</td>
                                                                            <td><p-tag [value]="verse.errorCount" severity="warn" /></td>
                                                                        </tr>
                                                                    </ng-template>
                                                                </p-table>
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            </ng-template>
                                        </p-table>
                                    }
                                </div>
                            } @else if (!loading) {
                                <div class="text-surface-500 py-8 text-center">{{ 'common.no_data' | translate }}</div>
                            }
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            } @else {
                <div class="text-surface-500 py-8 text-center">{{ 'pages.recommendations.select_filters' | translate }}</div>
            }
        </div>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class RecommendationsDashboard implements OnInit {
    selectedCourseId: string | null = null;
    selectedStudentId: string | null = null;
    activeTab: RecTab = 'recommendations';

    courseOptions: { label: string; value: string }[] = [];
    studentOptions: { label: string; value: string }[] = [];

    loading = false;
    sending = false;
    recommendationsLoaded = false;
    juzzTestLoaded = false;

    recommendation = signal<RecommendationResponseDTO | null>(null);
    juzzTest = signal<JuzzTestResponseDTO | null>(null);
    expandedSurahIds = signal<{ [key: string]: boolean }>({});

    private courses: Course[] = [];
    private students: Student[] = [];

    constructor(
        private recommendationService: RecommendationService,
        private courseService: CourseService,
        private studentService: StudentService,
        private notificationService: NotificationService,
        private confirmationService: ConfirmationService,
        private translate: TranslateService
    ) {}

    ngOnInit() {
        this.loadCourses();
    }

    loadCourses() {
        this.courseService.list(1, 100).subscribe({
            next: (res) => {
                this.courses = res?.data ?? [];
                this.courseOptions = this.courses.map(c => ({ label: c.name ?? '', value: String(c.id) }));
            }
        });
    }

    onCourseChange() {
        this.selectedStudentId = null;
        this.studentOptions = [];
        this.resetData();
        if (this.selectedCourseId) {
            this.loadStudents();
        }
    }

    loadStudents() {
        this.studentService.list(1, 100, { role: 'Student' }).subscribe({
            next: (res) => {
                this.students = res?.data ?? [];
                this.studentOptions = this.students.map(s => ({
                    label: s.profile ? `${s.profile.firstName ?? ''} ${s.profile.lastName ?? ''}`.trim() || s.username : s.username,
                    value: String(s.id)
                }));
            }
        });
    }

    onStudentChange() {
        this.resetData();
        if (this.selectedStudentId && this.selectedCourseId) {
            this.loadData();
        }
    }

    onTabChange(tab: string | number | undefined) {
        if (tab !== 'recommendations' && tab !== 'juzz-test') return;
        this.activeTab = tab;
        if (!this.selectedStudentId || !this.selectedCourseId) return;
        if (tab === 'juzz-test' && !this.juzzTestLoaded) {
            this.loadJuzzTest();
        } else if (tab === 'recommendations' && !this.recommendationsLoaded) {
            this.loadRecommendations();
        }
    }

    private resetData() {
        this.recommendation.set(null);
        this.juzzTest.set(null);
        this.recommendationsLoaded = false;
        this.juzzTestLoaded = false;
        this.expandedSurahIds.set({});
    }

    private loadData() {
        this.loading = true;
        if (this.activeTab === 'recommendations') {
            this.loadRecommendations();
        } else {
            this.loadJuzzTest();
        }
    }

    private loadRecommendations() {
        if (!this.selectedStudentId || !this.selectedCourseId) return;
        this.loading = true;
        this.recommendationService.getRecommendations(this.selectedStudentId, this.selectedCourseId).subscribe({
            next: (data) => {
                this.recommendation.set(data);
                this.recommendationsLoaded = true;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private loadJuzzTest() {
        if (!this.selectedStudentId || !this.selectedCourseId) return;
        this.loading = true;
        this.recommendationService.getJuzzTest(this.selectedStudentId, this.selectedCourseId).subscribe({
            next: (data) => {
                this.juzzTest.set(data);
                this.juzzTestLoaded = true;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    sendRecommendation() {
        if (!this.selectedStudentId || !this.selectedCourseId) return;
        this.confirmationService.confirm({
            message: this.translate.instant('pages.recommendations.send_confirm'),
            header: this.translate.instant('common.confirm'),
            icon: 'pi pi-send',
            accept: () => {
                this.sending = true;
                this.recommendationService.sendRecommendation(this.selectedStudentId!, this.selectedCourseId!).subscribe({
                    next: () => {
                        this.sending = false;
                        this.notificationService.success(this.translate.instant('pages.recommendations.sent_success'));
                    },
                    error: () => {
                        this.sending = false;
                    }
                });
            }
        });
    }

    toggleSurahRow(surahId: number) {
        const current = { ...this.expandedSurahIds() };
        const key = String(surahId);
        if (current[key]) {
            delete current[key];
        } else {
            current[key] = true;
        }
        this.expandedSurahIds.set(current);
    }

    priorityLabel(priority: number): string {
        if (priority >= 3) return 'High';
        if (priority === 2) return 'Medium';
        return 'Low';
    }

    prioritySeverity(priority: number): 'danger' | 'warn' | 'info' {
        if (priority >= 3) return 'danger';
        if (priority === 2) return 'warn';
        return 'info';
    }

    getPriorityWidth(score: number): number {
        return Math.min(score / 2, 100);
    }

    getPriorityColor(score: number): string {
        if (score >= 10) return '#ef4444';
        if (score >= 5) return '#f97316';
        return '#22c55e';
    }
}

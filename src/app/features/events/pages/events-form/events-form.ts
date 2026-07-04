import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormErrors } from '@/app/shared/components/form-errors/form-errors';
import { EventService } from '@/app/features/events/services/event.service';
import { EventType } from '@/app/features/events/models/event-type.enum';
import { Event as EventModel } from '@/app/features/events/models/event.model';
import { CourseService } from '@/app/features/courses/services/course.service';
import { Course } from '@/app/features/courses/models/course.model';
import { NotificationService } from '@/app/core/services/notification.service';

@Component({
    selector: 'app-events-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        TextareaModule,
        ToggleSwitchModule,
        TranslateModule,
        FormErrors
    ],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ isEditMode ? ('pages.events.edit_title' | translate) : ('pages.events.create_title' | translate) }}</h2>
                <p class="text-surface-500">{{ isEditMode ? ('pages.events.edit_subtitle' | translate) : ('pages.events.create_subtitle' | translate) }}</p>
            </div>
            <p-button *ngIf="viewOnly" [label]="'common.edit' | translate" icon="pi pi-pencil" severity="secondary" (onClick)="goToEdit()"></p-button>
        </div>

        <div class="card">
            <form [formGroup]="eventForm">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    <div>
                        <label for="eventName" class="block font-bold mb-3">{{ 'fields.event_name' | translate }} <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="eventName" formControlName="name" required fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <app-form-errors [control]="eventForm.get('name')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="eventCourse" class="block font-bold mb-3">{{ 'fields.course' | translate }} <span class="text-red-500">*</span></label>
                        <p-select
                            id="eventCourse"
                            [options]="courses()"
                            optionLabel="name"
                            optionValue="id"
                            formControlName="courseId"
                            appendTo="body"
                            [disabled]="submitting || viewOnly"
                            [placeholder]="'common.select_course' | translate"
                            [loading]="coursesLoading"
                            fluid
                            [filter]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="38"
                            [lazy]="true"
                            (onLazyLoad)="onCourseLazyLoad($event)"
                        />
                        <app-form-errors [control]="eventForm.get('courseId')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="eventType" class="block font-bold mb-3">{{ 'fields.event_type' | translate }} <span class="text-red-500">*</span></label>
                        <p-select
                            id="eventType"
                            [options]="eventTypeOptions"
                            optionLabel="label"
                            optionValue="value"
                            formControlName="type"
                            appendTo="body"
                            [disabled]="submitting || viewOnly"
                            [placeholder]="'common.select_type' | translate"
                            fluid
                        />
                        <app-form-errors [control]="eventForm.get('type')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="pointsReward" class="block font-bold mb-3">{{ 'fields.points_reward' | translate }} <span class="text-red-500">*</span></label>
                        <p-inputnumber id="pointsReward" formControlName="pointsRewardAmount" [min]="0" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <app-form-errors [control]="eventForm.get('pointsRewardAmount')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="targetCriteria" class="block font-bold mb-3">{{ 'fields.target_criteria' | translate }} <span class="text-red-500">*</span></label>
                        <p-inputnumber id="targetCriteria" formControlName="targetCriteria" [min]="0" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <app-form-errors [control]="eventForm.get('targetCriteria')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="startDate" class="block font-bold mb-3">{{ 'fields.start_date' | translate }} <span class="text-red-500">*</span></label>
                        <input type="date" pInputText id="startDate" formControlName="startDate" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <app-form-errors [control]="eventForm.get('startDate')" [show]="submitted"></app-form-errors>
                    </div>
                    <div>
                        <label for="endDate" class="block font-bold mb-3">{{ 'fields.end_date' | translate }} <span class="text-red-500">*</span></label>
                        <input type="date" pInputText id="endDate" formControlName="endDate" fluid [readonly]="viewOnly" [disabled]="submitting" />
                        <app-form-errors [control]="eventForm.get('endDate')" [show]="submitted"></app-form-errors>
                    </div>
                    <div class="flex items-center gap-3 pt-6">
                        <label for="isActive" class="block font-bold">{{ 'fields.is_active' | translate }}</label>
                        <p-toggleswitch id="isActive" formControlName="isActive" [readonly]="viewOnly" [disabled]="submitting || viewOnly" />
                    </div>
                    <div class="md:col-span-2">
                        <label for="description" class="block font-bold mb-3">{{ 'fields.description' | translate }}</label>
                        <textarea pTextarea id="description" formControlName="description" rows="3" fluid [readonly]="viewOnly" [disabled]="submitting"></textarea>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-6" *ngIf="!viewOnly">
                    <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="goBack()" [disabled]="submitting" />
                    <p-button [label]="'common.save' | translate" icon="pi pi-check" (onClick)="saveEvent()" [loading]="submitting" [disabled]="submitting"></p-button>
                </div>
            </form>
        </div>
    `
})
export class EventsForm implements OnInit {
    eventForm: FormGroup;

    viewOnly = false;
    isEditMode = false;
    submitted = false;
    submitting = false;

    currentEventId?: string;
    private originalEvent?: EventModel;

    courses = signal<Course[]>([]);
    coursesLoading = false;
    coursesPage = 1;
    coursesAllLoaded = false;

    eventTypeOptions: { label: string; value: EventType }[] = [];

    constructor(
        private eventService: EventService,
        private courseService: CourseService,
        private notification: NotificationService,
        private translate: TranslateService,
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.eventForm = this.fb.group({
            name: ['', Validators.required],
            courseId: [null, Validators.required],
            type: [null, Validators.required],
            pointsRewardAmount: [null, [Validators.required, Validators.min(0)]],
            targetCriteria: [null, [Validators.required, Validators.min(0)]],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            isActive: [false],
            description: ['']
        });
    }

    ngOnInit() {
        this.setEventTypeOptions();
        this.loadCourses();

        this.translate.onLangChange.subscribe(() => {
            this.setEventTypeOptions();
        });

        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.currentEventId = id;
                this.loadEvent(id);
            }
        });

        this.route.queryParamMap.subscribe((params) => {
            this.viewOnly = params.get('view') === '1';
        });
    }

    setEventTypeOptions() {
        this.eventTypeOptions = [
            { label: this.translate.instant('enums.event_type.Recitations'), value: EventType.Recitations },
            { label: this.translate.instant('enums.event_type.Attendances'), value: EventType.Attendances }
        ];
    }

    loadCourses() {
        this.coursesLoading = true;
        this.coursesPage = 1;
        this.coursesAllLoaded = false;
        this.courses.set([]);
        this.loadCoursesPage();
    }

    onCourseLazyLoad(event: { first: number; last: number }) {
        if (this.coursesLoading || this.coursesAllLoaded) return;
        if (event.last >= this.courses().length - 5) {
            this.coursesPage++;
            this.loadCoursesPage();
        }
    }

    private loadCoursesPage() {
        this.courseService.list(this.coursesPage, 30).subscribe({
            next: (res) => {
                const data = res?.data ?? [];
                this.courses.update((current) => [...current, ...data]);
                if (data.length < 30 || !res?.meta?.nextPage) {
                    this.coursesAllLoaded = true;
                }
                this.coursesLoading = false;
            },
            error: () => {
                this.coursesLoading = false;
            }
        });
    }

    loadEvent(id: string) {
        this.eventService.get(id).subscribe({
            next: (ev) => {
                this.originalEvent = ev;
                this.eventForm.patchValue({
                    name: ev.name ?? '',
                    courseId: ev.courseId ?? null,
                    type: ev.type ?? null,
                    pointsRewardAmount: ev.pointsRewardAmount ?? null,
                    targetCriteria: ev.targetCriteria ?? null,
                    startDate: ev.startDate ? ev.startDate.split('T')[0] : '',
                    endDate: ev.endDate ? ev.endDate.split('T')[0] : '',
                    isActive: ev.isActive ?? false,
                    description: ev.description ?? ''
                });
            }
        });
    }

    goToEdit() {
        if (!this.currentEventId) return;
        this.router.navigate(['/events', this.currentEventId, 'edit']);
    }

    goBack() {
        this.router.navigate(['/events']);
    }

    saveEvent() {
        if (this.viewOnly) return;
        this.submitted = true;
        this.eventForm.markAllAsTouched();
        if (this.eventForm.invalid) return;

        const formValue = this.eventForm.getRawValue();
        this.submitting = true;
        this.eventForm.disable();

        if (this.isEditMode && this.currentEventId) {
            const payload = this.buildUpdatePayload(formValue);
            this.eventService.update(this.currentEventId, payload).subscribe({
                next: () => {
                    this.submitting = false;
                    this.eventForm.enable();
                    this.notification.success(this.translate.instant('common.updated', { entity: this.translate.instant('entities.event') }));
                },
                error: () => {
                    this.submitting = false;
                    this.eventForm.enable();
                }
            });
            return;
        }

        this.eventService.create(formValue).subscribe({
            next: () => {
                this.submitting = false;
                this.eventForm.enable();
                this.notification.success(this.translate.instant('common.created', { entity: this.translate.instant('entities.event') }));
                this.router.navigate(['/events']);
            },
            error: () => {
                this.submitting = false;
                this.eventForm.enable();
            }
        });
    }

    private buildUpdatePayload(formValue: Record<string, unknown>): Record<string, unknown> {
        const orig = this.originalEvent;
        if (!orig) return formValue;

        const normalizeDate = (v: unknown) => (typeof v === 'string' ? v.split('T')[0] : '');
        const origStartDate = normalizeDate(orig.startDate);
        const origEndDate = normalizeDate(orig.endDate);
        const origActive = orig.isActive ?? false;

        const changed: Record<string, unknown> = {};
        const fields: string[] = [
            'name', 'courseId', 'type', 'pointsRewardAmount',
            'targetCriteria', 'description'
        ];

        for (const key of fields) {
            if (formValue[key] !== (orig as Record<string, unknown>)[key]) {
                changed[key] = formValue[key];
            }
        }

        if (normalizeDate(formValue['startDate']) !== origStartDate) {
            changed['startDate'] = formValue['startDate'];
        }
        if (normalizeDate(formValue['endDate']) !== origEndDate) {
            changed['endDate'] = formValue['endDate'];
        }
        if (formValue['isActive'] !== origActive) {
            changed['isActive'] = formValue['isActive'];
        }

        return changed;
    }
}

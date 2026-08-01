import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { UserService } from '@/app/features/users/services/user.service';
import { User } from '@/app/features/users/models/user.model';
import { FamilyRelation, FamilyRelationService } from '@/app/features/students/services/family-relation.service';
import { RelationType } from '@/app/features/students/models/relation-type.enum';

@Component({
    selector: 'app-guardian-students',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, TagModule, TranslateModule],
    template: `
        <div class="mb-6 flex items-start justify-between gap-4">
            <div>
                <h2 class="text-2xl font-semibold">{{ 'pages.guardians.students_title' | translate }}</h2>
                <p class="text-surface-500">{{ guardian()?.username ?? '' }}</p>
            </div>
            <p-button [label]="'common.back' | translate" icon="pi pi-arrow-left" text (onClick)="goBack()"></p-button>
        </div>

        <div *ngIf="loading" class="flex justify-center items-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
        </div>

        <div class="card" *ngIf="!loading">
            <div *ngIf="!relationsLoading && relations().length === 0" class="text-surface-500 text-center py-4">
                {{ 'common.no_data' | translate }}
            </div>

            <div *ngIf="relationsLoading" class="flex justify-center py-6">
                <i class="pi pi-spin pi-spinner text-xl"></i>
            </div>

            <p-table
                *ngIf="!relationsLoading && relations().length > 0"
                [value]="relations()"
                [tableStyle]="{ 'min-width': '50rem' }"
                [paginator]="true"
                [rows]="10"
                [totalRecords]="meta().total"
                [lazy]="true"
                (onPage)="onPage($event)"
            >
                <ng-template #header>
                    <tr>
                        <th>{{ 'fields.username' | translate }}</th>
                        <th>{{ 'fields.email' | translate }}</th>
                        <th>{{ 'fields.phone' | translate }}</th>
                        <th>{{ 'fields.relation_type' | translate }}</th>
                    </tr>
                </ng-template>
                <ng-template #body let-relation>
                    <tr>
                        <td>{{ relation.student?.username ?? '-' }}</td>
                        <td>{{ relation.student?.email ?? '-' }}</td>
                        <td>{{ relation.student?.phone ?? '-' }}</td>
                        <td>
                            <p-tag [value]="relationLabel(relation.relationType)" severity="info" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class GuardianStudents implements OnInit {
    guardian = signal<User | null>(null);
    relations = signal<FamilyRelation[]>([]);
    meta = signal<{ page: number; perPage: number; total: number }>({ page: 1, perPage: 10, total: 0 });

    loading = false;
    relationsLoading = false;

    private guardianId?: string;

    constructor(
        private userService: UserService,
        private familyRelationService: FamilyRelationService,
        private translate: TranslateService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.guardianId = id;
                this.loadGuardian(id);
                this.loadStudents(id);
            }
        });
    }

    loadGuardian(id: string) {
        this.loading = true;
        this.userService.get(id).subscribe({
            next: (data) => {
                this.guardian.set(data);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadStudents(id: string, page: number = 1, perPage: number = 10) {
        this.relationsLoading = true;
        this.familyRelationService.listStudents(id, page, perPage).subscribe({
            next: (res) => {
                this.relations.set(res?.data ?? []);
                this.meta.set({
                    page: res?.meta?.page ?? page,
                    perPage: res?.meta?.perPage ?? perPage,
                    total: res?.meta?.total ?? 0
                });
                this.relationsLoading = false;
            },
            error: () => {
                this.relationsLoading = false;
            }
        });
    }

    onPage(event: { first: number; rows: number }) {
        const page = Math.floor(event.first / event.rows) + 1;
        const perPage = event.rows;
        if (this.guardianId) {
            this.loadStudents(this.guardianId, page, perPage);
        }
    }

    goBack() {
        this.router.navigate(['/guardians']);
    }

    relationLabel(relationType?: RelationType | string): string {
        if (relationType === RelationType.Father) return this.translate.instant('relations.father');
        if (relationType === RelationType.Mother) return this.translate.instant('relations.mother');
        return relationType ? String(relationType) : '-';
    }
}

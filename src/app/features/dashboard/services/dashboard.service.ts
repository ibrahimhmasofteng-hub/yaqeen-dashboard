import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@/app/core/services/api.service';

export interface DashboardSummary {
    studentsTotal: number;
    studentsDeltaMonth: number;
    teachersTotal: number;
    teachersDeltaMonth: number;
    coursesTotal: number;
    coursesDeltaMonth: number;
    groupsTotal: number;
    groupsDeltaMonth: number;
}

export type RoleKey = 'student' | 'teacher' | 'guardian' | 'supervisor';

export interface RecentActor {
    id: string;
    name: string;
    roleKey: RoleKey;
    createdAt: string;
}

export interface TopCourse {
    id: string;
    name: string;
    typeKey: string;
    students: number;
    progress: number;
}

export interface MonthlyGrowth {
    labels: string[];
    students: number[];
    groups: number[];
    courses: number[];
}

export interface DashboardData {
    summary: DashboardSummary;
    recentRegistrations: RecentActor[];
    topCourses: TopCourse[];
    monthlyGrowth: MonthlyGrowth;
}

interface ApiResponse {
    summary: {
        studentsTotal: number;
        studentsDeltaMonth: number;
        teachersTotal: number;
        teachersDeltaMonth: number;
        coursesTotal: number;
        coursesDeltaMonth: number;
        groupsTotal: number;
        groupsDeltaMonth: number;
    };
    recentRegistrations: Array<{
        id: string;
        name: string;
        role: string;
        createdAt: string;
    }>;
    topCourses: Array<{
        id: string;
        name: string;
        type: string;
        studentCount: number;
    }>;
    monthlyGrowth: {
        labels: string[];
        students: number[];
        groups: number[];
        courses: number[];
    };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private api = inject(ApiService);

    /** Single call that provides all dashboard widget data. */
    getDashboard(): Observable<DashboardData> {
        return this.api.get<ApiResponse>('dashboard/summary').pipe(map((res) => this.map(res)));
    }

    private map(res: ApiResponse): DashboardData {
        const courses = res.topCourses ?? [];
        const max = Math.max(1, ...courses.map((c) => c.studentCount ?? 0));

        return {
            summary: res.summary,
            recentRegistrations: (res.recentRegistrations ?? []).map((r) => ({
                id: r.id,
                name: r.name,
                roleKey: this.normalizeRole(r.role),
                createdAt: this.formatDate(r.createdAt)
            })),
            topCourses: courses.map((c) => ({
                id: c.id,
                name: c.name,
                typeKey: this.courseTypeKey(c.type),
                students: c.studentCount ?? 0,
                progress: Math.round(((c.studentCount ?? 0) / max) * 100)
            })),
            monthlyGrowth: {
                labels: res.monthlyGrowth?.labels ?? [],
                students: res.monthlyGrowth?.students ?? [],
                groups: res.monthlyGrowth?.groups ?? [],
                courses: res.monthlyGrowth?.courses ?? []
            }
        };
    }

    private normalizeRole(role: string): RoleKey {
        const r = (role ?? '').toLowerCase();
        if (r.includes('teacher')) return 'teacher';
        if (r.includes('guardian')) return 'guardian';
        if (r.includes('supervisor')) return 'supervisor';
        return 'student';
    }

    private courseTypeKey(type: string): string {
        switch (type) {
            case 'Fiqh':
                return 'dashboard.course_type_fiqh';
            case 'Hadith':
                return 'dashboard.course_type_hadith';
            default:
                return 'dashboard.course_type_quran';
        }
    }

    private formatDate(iso?: string): string {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
}

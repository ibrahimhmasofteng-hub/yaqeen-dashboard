import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    private count = signal(0);

    loading = this.count.asReadonly();

    show(): void {
        this.count.update((value) => value + 1);
    }

    hide(): void {
        this.count.update((value) => Math.max(0, value - 1));
    }
}

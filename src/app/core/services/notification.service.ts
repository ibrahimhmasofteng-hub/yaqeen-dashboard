import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private messages: MessageService) {}

    success(detail: string, summary: string = 'Success'): void {
        this.messages.add({ key: 'tst', severity: 'success', summary, detail, life: 3000 });
    }

    error(detail: string, summary: string = 'Error'): void {
        this.messages.add({ key: 'tst', severity: 'error', summary, detail, life: 4000 });
    }

    warn(detail: string, summary: string = 'Warning'): void {
        this.messages.add({ key: 'tst', severity: 'warn', summary, detail, life: 3500 });
    }
}

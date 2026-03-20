import { Component } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Dashboard</div>
            <p>Dashboard content will be built based on admin and supervisor requirements.</p>
        </div>
    `
})
export class Dashboard {}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Main',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/users'] },
                    { label: 'Roles', icon: 'pi pi-fw pi-id-card', routerLink: ['/roles'] },
                    { label: 'Supervisors', icon: 'pi pi-fw pi-user-plus', routerLink: ['/supervisors'] },
                    { label: 'Audit Logs', icon: 'pi pi-fw pi-file', routerLink: ['/audit-logs'] }
                ]
            }
        ];
    }
}

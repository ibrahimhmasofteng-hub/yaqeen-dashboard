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
                label: 'menu.main',
                items: [
                    { label: 'menu.dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    {
                        label: 'menu.management',
                        icon: 'pi pi-fw pi-briefcase',
                        path: 'management',
                        items: [
                            { label: 'menu.users', icon: 'pi pi-fw pi-users', routerLink: ['/users'] },
                            { label: 'menu.supervisors', icon: 'pi pi-fw pi-user-plus', routerLink: ['/supervisors'] },
                            { label: 'menu.teachers', icon: 'pi pi-fw pi-briefcase', routerLink: ['/teachers'] },
                            { label: 'menu.students', icon: 'pi pi-fw pi-users', routerLink: ['/students'] }
                        ]
                    },
                    { label: 'menu.courses', icon: 'pi pi-fw pi-book', routerLink: ['/courses'] },
                    { label: 'menu.groups', icon: 'pi pi-fw pi-sitemap', routerLink: ['/groups'] },
                    { label: 'menu.roles', icon: 'pi pi-fw pi-id-card', routerLink: ['/roles'] },
                    { label: 'menu.audit_logs', icon: 'pi pi-fw pi-file', routerLink: ['/audit-logs'] }
                ]
            }
        ];
    }
}

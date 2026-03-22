import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '@/app/core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Menu } from 'primeng/menu';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, MenuModule, TranslateModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img src="assets/images/logo.png" alt="Logo" class="h-8 w-auto" />
                <span>{{ 'topbar.brand' | translate }}</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <div class="layout-topbar-menu-trigger">
                <button type="button" class="layout-topbar-action" (click)="langMenu.toggle($event)">
                    <i class="pi pi-globe"></i>
                </button>
                <p-menu #langMenu [popup]="true" [model]="languageItems" appendTo="body"></p-menu>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>{{ 'topbar.calendar' | translate }}</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>{{ 'topbar.messages' | translate }}</span>
                    </button>
                    <div class="layout-topbar-menu-trigger">
                        <button type="button" class="layout-topbar-action" (click)="profileMenu.toggle($event)">
                            <i class="pi pi-user"></i>
                            <span>{{ 'topbar.profile' | translate }}</span>
                        </button>
                        <p-menu #profileMenu [popup]="true" [model]="profileItems" appendTo="body"></p-menu>
                    </div>
                </div>
            </div>
        </div>
    </div>`,
    styles: [
        `
            :host ::ng-deep .p-menu {
                min-width: 10rem;
            }
        `
    ]
})
export class AppTopbar implements OnInit {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    private auth = inject(AuthService);
    private translate = inject(TranslateService);

    profileItems: MenuItem[] = [];
    languageItems: MenuItem[] = [];

    @ViewChild('profileMenu') profileMenu!: Menu;
    @ViewChild('langMenu') langMenu!: Menu;

    ngOnInit() {
        this.refreshTranslations();
        this.translate.onLangChange.subscribe(() => this.refreshTranslations());
        this.translate.onTranslationChange.subscribe(() => this.refreshTranslations());
    }

    private setProfileItems() {
        this.profileItems = [
            {
                label: this.translate.instant('topbar.logout'),
                icon: 'pi pi-sign-out',
                command: () => this.auth.logoutLocal(true)
            }
        ];
    }

    setLang(lang: 'en' | 'ar') {
        this.translate.use(lang);
        localStorage.setItem('lang', lang);
        if (this.langMenu) this.langMenu.hide();
    }

    private setLanguageItems() {
        this.languageItems = [
            {
                label: this.translate.instant('topbar.lang_en'),
                command: () => this.setLang('en')
            },
            {
                label: this.translate.instant('topbar.lang_ar'),
                command: () => this.setLang('ar')
            }
        ];
    }

    private refreshTranslations() {
        this.translate
            .get(['topbar.logout', 'topbar.lang_en', 'topbar.lang_ar'])
            .subscribe(() => {
                this.setProfileItems();
                this.setLanguageItems();
            });
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}

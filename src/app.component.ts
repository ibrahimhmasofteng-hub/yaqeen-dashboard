import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule],
    template: `<p-toast key="tst"></p-toast><router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    private translate = inject(TranslateService);
    private document = inject(DOCUMENT);

    ngOnInit() {
        const savedLang = localStorage.getItem('lang');
        const initialLang = savedLang || this.translate.currentLang || this.translate.defaultLang || 'en';
        if (this.translate.currentLang !== initialLang) {
            this.translate.use(initialLang);
        }
        this.applyDirection(initialLang);
        this.translate.onLangChange.subscribe((event) => this.applyDirection(event.lang));
    }

    private applyDirection(lang: string) {
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        this.document.documentElement.setAttribute('dir', dir);
        this.document.documentElement.setAttribute('lang', lang);
    }
}

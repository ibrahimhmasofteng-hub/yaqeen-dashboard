import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarModule } from 'primeng/progressbar';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/core/services/auth.service';
import { LoadingService } from '@/app/core/services/loading.service';

@Component({
    selector: 'app-complete-registration',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        ReactiveFormsModule,
        RouterModule,
        RippleModule,
        TranslateModule,
        ProgressBarModule,
        AppFloatingConfigurator
    ],
    template: `
        <p-progressbar mode="indeterminate" [style]="{ height: '3px', visibility: isLoading() ? 'visible' : 'hidden' }" styleClass="layout-top-progress"></p-progressbar>
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/logo.png" alt="Logo" class="mb-8 w-20 mx-auto" />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ 'auth.complete_registration_title' | translate }}</div>
                            <span class="text-muted-color font-medium">{{ 'auth.complete_registration_subtitle' | translate }}</span>
                        </div>

                        <form [formGroup]="form" (ngSubmit)="onSubmit()">
                            <label for="password" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">{{ 'auth.new_password' | translate }}</label>
                            <div class="w-full md:w-120">
                                <p-password id="password" formControlName="password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" [disabled]="submitting"></p-password>
                            </div>
                            <small class="text-red-500 block -mt-2 mb-6" *ngIf="submitted && _password?.invalid">
                                {{ 'validation.required' | translate: { field: ('auth.password' | translate) } }}
                            </small>

                            <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">{{ 'auth.confirm_password' | translate }}</label>
                            <div class="w-full md:w-120">
                                <p-password id="confirmPassword" formControlName="confirmPassword" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" [disabled]="submitting"></p-password>
                            </div>
                            <small class="text-red-500 block -mt-2 mb-6" *ngIf="submitted && form.errors?.['passwordMismatch']">
                                {{ 'validation.password_mismatch' | translate }}
                            </small>

                            <p-button type="submit" [label]="'auth.update_password' | translate" styleClass="w-full" [disabled]="submitting || form.invalid" [loading]="submitting"></p-button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class CompleteRegistration {
    submitting = false;
    submitted = false;
    form: FormGroup;

    private auth = inject(AuthService);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private loadingService = inject(LoadingService);
    isLoading = computed(() => this.loadingService.loading() > 0);

    constructor() {
        this.form = this.fb.group(
            {
                password: new FormControl('', [Validators.required, Validators.minLength(8)]),
                confirmPassword: new FormControl('', [Validators.required])
            },
            { validators: this.passwordMatchValidator }
        );
    }

    onSubmit() {
        this.submitted = true;
        if (this.form.invalid || this.submitting) return;
        this.submitting = true;
        this.form.disable();
        const { password } = this.form.value;
        this.auth.completeRegistration(password).subscribe({
            next: () => {
                this.submitting = false;
                this.router.navigate(['/']);
            },
            error: () => {
                this.submitting = false;
                this.form.enable();
            }
        });
    }

    passwordMatchValidator(group: FormGroup) {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
    }

    get _password() {
        return this.form.get('password');
    }
}

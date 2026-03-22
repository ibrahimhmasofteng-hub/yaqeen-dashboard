import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/core/services/notification.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { LoadingService } from '@/app/core/services/loading.service';
import { AccountStatus } from '@/app/features/users/models/account-status.enum';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, ReactiveFormsModule, RouterModule, RippleModule, TranslateModule, ProgressBarModule],
    template: `
        <p-progressbar *ngIf="isLoading()" mode="indeterminate" [style]="{ height: '3px' }" styleClass="layout-top-progress"></p-progressbar>
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/logo.png" alt="Logo" class="mb-8 w-20 mx-auto" />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ 'auth.welcome' | translate }}</div>
                            <span class="text-muted-color font-medium">{{ 'auth.sign_in_to_continue' | translate }}</span>
                        </div>

                        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                            <label for="username1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">{{ 'auth.username' | translate }}</label>
                            <input pInputText id="username1" type="text" [placeholder]="'auth.username_placeholder' | translate" class="w-full md:w-120 mb-2" formControlName="username" />
                            <small class="text-red-500 block mb-6" *ngIf="submitted && _username?.invalid">
                                {{ 'validation.required' | translate: { field: ('auth.username' | translate) } }}
                            </small>

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">{{ 'auth.password' | translate }}</label>
                            <p-password id="password1" formControlName="password" [placeholder]="'auth.password_placeholder' | translate" [toggleMask]="true" styleClass="mb-2" [fluid]="true" [feedback]="false"></p-password>
                            <small class="text-red-500 block mb-6" *ngIf="submitted && _password?.invalid">
                                {{ 'validation.required' | translate: { field: ('auth.password' | translate) } }}
                            </small>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox formControlName="remember" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">{{ 'auth.remember_me' | translate }}</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">{{ 'auth.forgot_password' | translate }}</span>
                            </div>
                            <p-button type="submit" [label]="'auth.sign_in' | translate" styleClass="w-full" [disabled]="submitting || loginForm.invalid" [loading]="submitting"></p-button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    submitting = false;
    submitted = false;
    loginForm: FormGroup;

    private auth = inject(AuthService);
    private router = inject(Router);
    private notify = inject(NotificationService);
    private fb = inject(FormBuilder);
    private loadingService = inject(LoadingService);
    isLoading = computed(() => this.loadingService.loading() > 0);

    constructor() {
        this.loginForm = this.fb.group({
            username: new FormControl('', [Validators.required]),
            password: new FormControl('', [Validators.required, Validators.minLength(8)]),
            remember: [false]
        });
    }

    onSubmit() {
        this.submitted = true;
        if (this.loginForm.invalid || this.submitting) return;
        if (this.submitting) return;
        this.submitting = true;
        const { username, password } = this.loginForm.value;
        this.auth.login({ username, password }).subscribe({
            next: () => {
                this.submitting = false;
                const status = this.auth.user()?.accountStatus;
                if (status === AccountStatus.COMPLETE_REGISTRATION_REQUIRED) {
                    this.router.navigate(['/auth/complete-registration']);
                    return;
                }
                this.router.navigate(['/']);
            },
            error: () => {
                this.submitting = false;
            }
        });
    }

    get _username() {
        return this.loginForm.get('username');
    }

    get _password() {
        return this.loginForm.get('password');
    }
}

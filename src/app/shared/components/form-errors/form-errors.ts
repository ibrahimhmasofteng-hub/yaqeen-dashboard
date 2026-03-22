import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-form-errors',
    standalone: true,
    imports: [CommonModule],
    template: `
        <small class="text-red-500" *ngIf="show && message">{{ message }}</small>
    `
})
export class FormErrors {
    private translate = inject(TranslateService);
    @Input() control: AbstractControl | null = null;
    @Input() show: boolean = false;

    get message(): string | null {
        const errors = this.control?.errors;
        if (!errors) return null;

        const priority: Array<keyof ValidationErrors> = ['required', 'minlength', 'maxlength', 'email'];
        const errorKey = priority.find((key) => errors[key]);
        if (!errorKey) return null;

        const field = this.fieldLabel;
        switch (errorKey) {
            case 'required':
                return this.translate.instant('validation.required', { field });
            case 'minlength':
                return this.translate.instant('validation.minlength', {
                    field,
                    min: errors['minlength']?.requiredLength
                });
            case 'maxlength':
                return this.translate.instant('validation.maxlength', {
                    field,
                    max: errors['maxlength']?.requiredLength
                });
            case 'email':
                return this.translate.instant('validation.email', { field });
            default:
                return null;
        }
    }

    private get fieldLabel(): string {
        const name = this.controlName ?? 'field';
        const translationKey = this.fieldKeyMap[name];
        if (translationKey) {
            const translated = this.translate.instant(translationKey);
            if (translated && translated !== translationKey) {
                return translated;
            }
        }
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    private get controlName(): string | null {
        const anyControl = this.control as any;
        return anyControl?._parent && anyControl?._parent?.controls
            ? Object.keys(anyControl._parent.controls).find((key) => anyControl._parent.controls[key] === this.control) ?? null
            : null;
    }

    private fieldKeyMap: Record<string, string> = {
        username: 'fields.username',
        email: 'fields.email',
        phone: 'fields.phone',
        password: 'fields.password',
        roleId: 'fields.role',
        accountStatus: 'fields.account_status',
        firstName: 'fields.first_name',
        lastName: 'fields.last_name',
        midName: 'fields.mid_name',
        additionalName: 'fields.additional_name',
        birthDate: 'fields.birth_date',
        birthPlace: 'fields.birth_place',
        nationalId: 'fields.national_id',
        imageId: 'fields.image_id',
        job: 'fields.job',
        education: 'fields.education',
        address: 'fields.address',
        distinguishingSigns: 'fields.distinguishing_signs',
        note: 'fields.note',
        name: 'fields.name',
        relationType: 'fields.relation_type'
    };
}

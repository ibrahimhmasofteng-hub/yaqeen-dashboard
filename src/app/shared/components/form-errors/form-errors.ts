import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
    selector: 'app-form-errors',
    standalone: true,
    imports: [CommonModule],
    template: `
        <small class="text-red-500" *ngIf="show && message">{{ message }}</small>
    `
})
export class FormErrors {
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
                return `${field} is required.`;
            case 'minlength':
                return `${field} must be at least ${errors['minlength']?.requiredLength} characters.`;
            case 'maxlength':
                return `${field} must be at most ${errors['maxlength']?.requiredLength} characters.`;
            case 'email':
                return `${field} is invalid.`;
            default:
                return null;
        }
    }

    private get fieldLabel(): string {
        const name = this.controlName ?? 'This field';
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    private get controlName(): string | null {
        const anyControl = this.control as any;
        return anyControl?._parent && anyControl?._parent?.controls
            ? Object.keys(anyControl._parent.controls).find((key) => anyControl._parent.controls[key] === this.control) ?? null
            : null;
    }
}

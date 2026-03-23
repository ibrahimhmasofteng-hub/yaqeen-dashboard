import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-floating-configurator',
    imports: [CommonModule],
    template: `
        <div class="hidden"></div>
    `
})
export class AppFloatingConfigurator {
    float = input<boolean>(true);
}

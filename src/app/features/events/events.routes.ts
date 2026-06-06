import { Routes } from '@angular/router';
import { EventsCrud } from './pages/events-crud/events-crud';
import { EventsForm } from './pages/events-form/events-form';
import { EventsDetail } from './pages/events-detail/events-detail';

export default [
    { path: 'new', component: EventsForm },
    { path: ':id/edit', component: EventsForm },
    { path: ':id', component: EventsDetail },
    { path: '', component: EventsCrud }
] as Routes;

import { Routes } from '@angular/router';
import { SimpleTestComponent } from './simple-test.component';
import { NpmTestComponent } from './npm-test.component';
import { CleanTestComponent } from './clean-test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/simple', pathMatch: 'full' },
  { path: 'simple', component: SimpleTestComponent },
  { path: 'npm', component: NpmTestComponent },
  { path: 'clean', component: CleanTestComponent }
];

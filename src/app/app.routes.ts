import { Routes } from '@angular/router';
import { Home } from './shared/presentation/views/home/home';
import { iamGuard } from './iam/infrastructure/iam.guard';
import { roleGuard } from './iam/infrastructure/role.guard';

//no page
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

//core business
const clients = () =>
  import('./arm/presentation/views/client-page/client-page.component').then((m) => m.ClientPageComponent);
const vehicle = () =>
  import('./arm/presentation/views/vehicle-page/vehicle-page.component').then((m) => m.VehiclePageComponent);
const configuration = () =>
    import('./sdp/presentation/views/configuration-page/configuration-page.component').then(m => m.ConfigurationPageComponent)
const simulation = () =>
  import('./sdp/presentation/views/simulation-page/simulation-page.component').then(m => m.SimulationPageComponent)
const schedule = () =>
    import('./sdp/presentation/views/schedule-page/schedule-page.component').then(m => m.SchedulePageComponent)
const report = () =>
    import('./sdp/presentation/views/report-page/report-page.component').then(m => m.ReportPageComponent)
const profile = () =>
    import('./shared/presentation/views/profile/profile').then(m => m.Profile)
const workers = () =>
    import('./admin/presentation/views/workers-page/workers-page.component').then(m => m.WorkersPageComponent)
const adminReports = () =>
    import('./admin/presentation/views/company-reports-page/company-reports-page.component').then(m => m.CompanyReportsPageComponent)

//register context
const iamRoutes = () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes);
const totpVerify = () => import('./iam/presentation/views/totp-verify/totp-verify.component').then(m => m.TotpVerifyComponent);
const totpSetup  = () => import('./iam/presentation/views/totp-setup/totp-setup.component').then(m => m.TotpSetupComponent);

const baseTitle = 'SmartDrive';
export const routes: Routes = [
  { path: 'home', component: Home, title: `${baseTitle} / Home`, canActivate: [iamGuard]},
  { path: 'client', loadComponent: clients, title: `${baseTitle} / Client`, canActivate: [iamGuard]},
  { path: 'vehicle', loadComponent: vehicle, title: `${baseTitle} / Vehicle`, canActivate: [iamGuard]},
  { path: 'configuration', loadComponent: configuration, title: `${baseTitle} / Configuration`, canActivate: [iamGuard, roleGuard(['SELLER'])] },
  { path: 'simulation', loadComponent: simulation, title: `${baseTitle} / Simulation`, canActivate: [iamGuard, roleGuard(['SELLER'])] },
  { path: 'schedule', loadComponent: schedule, title: `${baseTitle} / Schedule`, canActivate: [iamGuard, roleGuard(['SELLER'])] },
  { path: 'report', loadComponent: report, title: `${baseTitle} / Report`, canActivate: [iamGuard, roleGuard(['SELLER'])] },
  { path: 'profile', loadComponent: profile, title: `${baseTitle} / Profile`, canActivate: [iamGuard] },
  { path: 'workers', loadComponent: workers, title: `${baseTitle} / Workers`, canActivate: [iamGuard, roleGuard(['ADMIN'])] },
  { path: 'admin-reports', loadComponent: adminReports, title: `${baseTitle} / Company Reports`, canActivate: [iamGuard, roleGuard(['ADMIN'])] },
  { path: 'iam', loadChildren: iamRoutes },
  { path: 'totp-setup',  loadComponent: totpSetup, title: `${baseTitle} / TOTP setup`  },
  { path: 'totp-verify', loadComponent: totpVerify, title: `${baseTitle} / TOTP Verify` },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: pageNotFound,
    title: `${baseTitle} - Page Not Found`,
    canActivate: [iamGuard]
  },
];

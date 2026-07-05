import {Routes} from '@angular/router';

const signInForm = () => import('./views/sign-in-form/sign-in-form').then(m => m.SignInForm);
const signUpForm = () => import('./views/sign-up-form/sign-up-form.component').then(m => m.SignUpForm);
const forgotPassword = () => import('./views/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent);

/**
 * Route tree for IAM presentation views.
 */
export const iamRoutes: Routes = [
  { path: 'sign-in', loadComponent: signInForm, title: `SDF / Sign In`},
  { path: 'sign-up', loadComponent: signUpForm, title: `SDF / Sign Up`},
  { path: 'forgot-password', loadComponent: forgotPassword, title: `SDF / Reset Password`}
];

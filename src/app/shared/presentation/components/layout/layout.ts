import { NgClass, UpperCasePipe } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, computed, inject, signal, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';

import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ToastHost } from '../toast-host/toast-host';
import { IamStore } from '../../../../iam/application/iam.store';
import { NotificationStore } from '../../../application/notification.store';
import { PreferencesStore } from '../../../application/preferences.store';

interface MenuOption {
  icon: string;
  path: string;
  title: string;
}

/**
 * Main shell component that hosts top-level navigation and routed content.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    NgClass,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    TranslatePipe,
    LanguageSwitcher,
    ToastHost,
    UpperCasePipe,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, AfterViewInit {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  readonly showShell = signal<boolean>(true);
  readonly notifOpen = signal<boolean>(false);

  activeOption = signal<string>('option.home');
  isSidenavOpen = true;

  readonly options: MenuOption[] = [
    { icon: 'home', path: '/home', title: 'option.home' },
    { icon: 'supervised_user_circle', path: '/client', title: 'option.client' },
    { icon: 'directions_car', path: '/vehicle', title: 'option.vehicle' },
    { icon: 'bar_chart', path: '/configuration', title: 'option.simulation' },
  ];

  private observer = inject(BreakpointObserver);
  private router = inject(Router);
  private translate = inject(TranslateService);
  protected store = inject(IamStore);
  protected notifications = inject(NotificationStore);
  private preferences = inject(PreferencesStore);

  currentUser = this.store.currentUser;

  /** All options are visible: this app has a single administrator, no role filtering. */
  readonly visibleOptions = computed(() => this.options);

  /** Prefers the custom display name set in preferences, falling back to the account email. */
  readonly displayName = computed(
    () =>
      this.preferences.displayName() ??
      this.store.currentEmail() ??
      this.translate.instant('layout.user.placeholder.name'),
  );

  readonly avatarPhoto = this.preferences.photo;
  readonly unreadCount = this.notifications.unreadCount;
  readonly notificationList = this.notifications.notifications;

  ngOnInit(): void {
    this.updateShellVisibility(this.router.url);
  }

  ngAfterViewInit(): void {
    this.observer.observe(['(max-width: 1280px)']).subscribe((response) => {
      if (!this.sidenav) return;

      if (response.matches) {
        this.sidenav.mode = 'over';
        this.sidenav.close();
        this.isSidenavOpen = false;
      } else {
        this.sidenav.mode = 'side';
        this.sidenav.open();
        this.isSidenavOpen = true;
      }
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateShellVisibility(event.urlAfterRedirects);
        this.notifOpen.set(false);
        const current = this.options.find((option) => option.path === event.urlAfterRedirects);
        if (current) {
          this.activeOption.set(current.title);
        }
      });
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
    this.sidenav?.toggle();
  }

  setActiveOption(option: string): void {
    this.activeOption.set(option);
  }

  performSignOut(): void {
    this.store.signOut(this.router);
  }

  // -- Notifications panel --------------------------------------
  toggleNotifications(): void {
    const willOpen = !this.notifOpen();
    this.notifOpen.set(willOpen);
    if (willOpen) {
      setTimeout(() => this.notifications.markAllRead(), 1200);
    }
  }

  closeNotifications(): void {
    this.notifOpen.set(false);
  }

  removeNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notifications.remove(id);
  }

  clearNotifications(): void {
    this.notifications.clearAll();
  }

  /** Human-friendly relative time used in the notifications panel. */
  relativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days} d`;
    return new Date(timestamp).toLocaleDateString('es-PE');
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  private static readonly NO_SHELL_ROUTES = new Set(['/iam/sign-in', '/iam/sign-up', '/totp-verify', '/totp-setup']);

  private updateShellVisibility(url: string): void {
    const pathOnly = url.split(/[?;]/)[0];
    this.showShell.set(!Layout.NO_SHELL_ROUTES.has(pathOnly));
  }

  navigateToTotpSetup(): void {
    this.router.navigate(['/totp-setup']);
  }
}

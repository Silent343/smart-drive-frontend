import { computed, inject, Injectable, signal } from '@angular/core';
import { PreferencesStore } from './preferences.store';
import { IamStore } from '../../iam/application/iam.store';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/**
 * A notification kept in the bell panel history.
 */
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  icon: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
  recipientUserId?: string;
}

/**
 * A transient toast shown briefly in the corner of the screen.
 */
export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  icon: string;
  type: NotificationType;
  recipientUserId?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'SmartdriveFinance.notifications';
const MAX_HISTORY = 50;
const TOAST_DURATION_MS = 6000;

/**
 * Central place to raise in-app notifications. A single {@link notify} call both
 * appends an entry to the persistent bell history and pops a transient toast,
 * unless the administrator has switched notifications off in preferences.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly preferences = inject(PreferencesStore);
  private readonly iamStore = inject(IamStore);

  private readonly listSignal = signal<AppNotification[]>(this.load());
  private readonly toastsSignal = signal<ToastMessage[]>([]);

  readonly notifications = computed(() => this.listSignal().filter((n) => this.isForCurrentUser(n)));
  readonly toasts = computed(() => this.toastsSignal().filter((n) => this.isForCurrentUser(n)));
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  /**
   * Raises a notification (history entry + toast). No-op when the user disabled
   * notifications from the profile preferences.
   */
  notify(input: { title: string; message: string; icon?: string; type?: NotificationType; recipientUserId?: string }): void {
    if (!this.preferences.notificationsEnabled()) return;

    const id = this.uuid();
    const icon = input.icon ?? 'notifications';
    const type = input.type ?? 'info';
    const recipientUserId = input.recipientUserId ?? this.iamStore.currentUserId() ?? undefined;

    const note: AppNotification = {
      id,
      title: input.title,
      message: input.message,
      icon,
      type,
      createdAt: Date.now(),
      read: false,
      recipientUserId,
    };
    this.listSignal.update((list) => [note, ...list].slice(0, MAX_HISTORY));
    this.persist();

    const toast: ToastMessage = { id, title: input.title, message: input.message, icon, type, recipientUserId };
    this.toastsSignal.update((toasts) => [...toasts, toast]);
    setTimeout(() => this.dismissToast(id), TOAST_DURATION_MS);
  }

  dismissToast(id: string): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  markAllRead(): void {
    if (this.unreadCount() === 0) return;
    this.listSignal.update((list) => list.map((n) =>
      this.isForCurrentUser(n) ? { ...n, read: true } : n,
    ));
    this.persist();
  }

  remove(id: string): void {
    this.listSignal.update((list) => list.filter((n) => n.id !== id));
    this.persist();
  }

  clearAll(): void {
    this.listSignal.update((list) => list.filter((n) => !this.isForCurrentUser(n)));
    this.persist();
  }

  private isForCurrentUser(notification: { recipientUserId?: string }): boolean {
    const currentUserId = this.iamStore.currentUserId();
    if (!currentUserId) return true;
    return notification.recipientUserId === currentUserId;
  }

  private uuid(): string {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
    } catch {
      /* fall through to manual id */
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private load(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppNotification[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.listSignal()));
    } catch {
      /* ignore storage errors */
    }
  }
}

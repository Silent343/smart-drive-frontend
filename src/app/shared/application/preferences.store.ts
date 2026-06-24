import { Injectable, signal } from '@angular/core';

/**
 * Shape of the preferences persisted in browser storage.
 */
interface PersistedPreferences {
  photo: string | null;
  displayName: string | null;
  notificationsEnabled: boolean;
}

const PREFERENCES_STORAGE_KEY = 'SmartdriveFinance.preferences';

/**
 * Application service that keeps the administrator's personal preferences
 * (profile photo, preferred display name and notification opt-in). Everything
 * is stored locally in the browser so the experience survives reloads without
 * requiring extra backend endpoints.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly photoSignal = signal<string | null>(null);
  private readonly displayNameSignal = signal<string | null>(null);
  private readonly notificationsEnabledSignal = signal<boolean>(true);

  readonly photo = this.photoSignal.asReadonly();
  readonly displayName = this.displayNameSignal.asReadonly();
  readonly notificationsEnabled = this.notificationsEnabledSignal.asReadonly();

  constructor() {
    const persisted = this.load();
    if (persisted) {
      this.photoSignal.set(persisted.photo ?? null);
      this.displayNameSignal.set(persisted.displayName ?? null);
      this.notificationsEnabledSignal.set(persisted.notificationsEnabled ?? true);
    }
  }

  setPhoto(dataUrl: string | null): void {
    this.photoSignal.set(dataUrl);
    this.persist();
  }

  setDisplayName(name: string | null): void {
    const trimmed = name?.trim() || null;
    this.displayNameSignal.set(trimmed);
    this.persist();
  }

  setNotificationsEnabled(enabled: boolean): void {
    this.notificationsEnabledSignal.set(enabled);
    this.persist();
  }

  private load(): PersistedPreferences | null {
    try {
      const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedPreferences) : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    const snapshot: PersistedPreferences = {
      photo: this.photoSignal(),
      displayName: this.displayNameSignal(),
      notificationsEnabled: this.notificationsEnabledSignal(),
    };
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage may be unavailable (private mode); ignore silently */
    }
  }
}

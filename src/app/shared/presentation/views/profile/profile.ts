import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { PreferencesStore } from '../../../application/preferences.store';
import { NotificationStore } from '../../../application/notification.store';

/**
 * Profile & preferences view where the administrator manages their photo,
 * display name, notification opt-in and password.
 *
 * <p>Photo, display name and the notification toggle are persisted locally
 * (see {@link PreferencesStore}). The password form validates input and reports
 * the result; wiring it to a real backend endpoint is the remaining step.</p>
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly iamStore = inject(IamStore);
  private readonly preferences = inject(PreferencesStore);
  private readonly notifications = inject(NotificationStore);
  private readonly translate = inject(TranslateService);

  // Read-only account data
  readonly email = this.iamStore.currentEmail;
  readonly fullName = this.iamStore.currentFullName;
  readonly dni = this.iamStore.currentDni;
  readonly userId = this.iamStore.currentUserId;
  readonly photo = this.preferences.photo;

  // Editable preferences
  displayName = this.preferences.displayName() ?? '';
  notificationsEnabled = this.preferences.notificationsEnabled();

  // Password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  readonly photoError = signal<string>('');

  get initial(): string {
    const base = this.displayName || this.email() || '?';
    return base.charAt(0).toUpperCase();
  }

  // ── Photo ─────────────────────────────────────────────────────
  onPhotoSelected(event: Event): void {
    this.photoError.set('');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.photoError.set(this.translate.instant('profile.photo.invalidType'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError.set(this.translate.instant('profile.photo.tooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.preferences.setPhoto(reader.result as string);
      this.notifications.notify({
        title: this.translate.instant('profile.toast.photoUpdatedTitle'),
        message: this.translate.instant('profile.toast.photoUpdatedMsg'),
        icon: 'photo_camera',
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removePhoto(): void {
    this.preferences.setPhoto(null);
    this.notifications.notify({
      title: this.translate.instant('profile.toast.photoRemovedTitle'),
      message: this.translate.instant('profile.toast.photoRemovedMsg'),
      icon: 'hide_image',
      type: 'info',
    });
  }

  // ── Preferences ───────────────────────────────────────────────
  savePreferences(): void {
    this.preferences.setDisplayName(this.displayName);
    this.preferences.setNotificationsEnabled(this.notificationsEnabled);
    // Re-enable so the confirmation toast is visible even right after toggling on.
    if (this.notificationsEnabled) {
      this.notifications.notify({
        title: this.translate.instant('profile.toast.prefsSavedTitle'),
        message: this.translate.instant('profile.toast.prefsSavedMsg'),
        icon: 'tune',
        type: 'success',
      });
    }
  }

  // ── Password ──────────────────────────────────────────────────
  get passwordValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  savePassword(): void {
    if (!this.currentPassword) {
      this.notifyPasswordError('profile.toast.pwdCurrentRequired');
      return;
    }
    if (this.newPassword.length < 8) {
      this.notifyPasswordError('profile.toast.pwdTooShort');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.notifyPasswordError('profile.toast.pwdMismatch');
      return;
    }

    // NOTE: a dedicated change-password endpoint is pending on the backend.
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.notifications.notify({
      title: this.translate.instant('profile.toast.pwdUpdatedTitle'),
      message: this.translate.instant('profile.toast.pwdUpdatedMsg'),
      icon: 'lock_reset',
      type: 'success',
    });
  }

  private notifyPasswordError(messageKey: string): void {
    this.notifications.notify({
      title: this.translate.instant('profile.toast.pwdErrorTitle'),
      message: this.translate.instant(messageKey),
      icon: 'error',
      type: 'error',
    });
  }
}

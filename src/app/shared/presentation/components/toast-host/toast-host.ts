import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationStore } from '../../../application/notification.store';

/**
 * Renders the stack of transient toasts in the top-right corner. It is mounted
 * once in the layout shell and reacts to the {@link NotificationStore} toasts signal.
 */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-host" aria-live="polite">
      @for (toast of store.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}">
          <div class="toast__icon">
            <mat-icon>{{ toast.icon }}</mat-icon>
          </div>
          <div class="toast__body">
            <p class="toast__title">{{ toast.title }}</p>
            <p class="toast__message">{{ toast.message }}</p>
          </div>
          <button class="toast__close" (click)="store.dismissToast(toast.id)" aria-label="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-host {
      position: fixed;
      top: 84px;
      right: 24px;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 380px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 14px 14px 16px;
      background: #ffffff;
      border-radius: 14px;
      border-left: 4px solid #0b1b3d;
      box-shadow: 0 12px 30px rgba(11, 27, 61, 0.18);
      animation: toast-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast--success { border-left-color: #16a34a; }
    .toast--info    { border-left-color: #2563eb; }
    .toast--warning { border-left-color: #d4af37; }
    .toast--error   { border-left-color: #dc2626; }
    .toast__icon {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      flex-shrink: 0;
      background: #f1f5f9;
      color: #0b1b3d;
    }
    .toast--success .toast__icon { background: #dcfce7; color: #16a34a; }
    .toast--info    .toast__icon { background: #dbeafe; color: #2563eb; }
    .toast--warning .toast__icon { background: #fef3c7; color: #b45309; }
    .toast--error   .toast__icon { background: #fee2e2; color: #dc2626; }
    .toast__icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .toast__body { flex: 1; min-width: 0; }
    .toast__title {
      margin: 0 0 2px;
      font-size: 0.92rem;
      font-weight: 700;
      color: #0b1b3d;
    }
    .toast__message {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.35;
      color: #475569;
      white-space: pre-line;
    }
    .toast__close {
      border: none;
      background: transparent;
      cursor: pointer;
      color: #94a3b8;
      display: grid;
      place-items: center;
      padding: 2px;
      border-radius: 8px;
      transition: background 0.15s, color 0.15s;
    }
    .toast__close:hover { background: #f1f5f9; color: #475569; }
    .toast__close mat-icon { font-size: 18px; width: 18px; height: 18px; }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `],
})
export class ToastHost {
  protected readonly store = inject(NotificationStore);
}

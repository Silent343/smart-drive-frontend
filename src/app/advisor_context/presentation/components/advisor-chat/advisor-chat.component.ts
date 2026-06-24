import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdvisorStore } from '../../../application/advisor.store';

/**
 * Loan advisor chat panel.
 *
 * Drop it next to a loan/simulation view and pass the `loanId`; the user can
 * then ask questions in natural language and get answers grounded in that
 * loan's real financial figures.
 *
 * The `loanId` is a signal input, so when the parent computes the real id
 * (after a simulation), an effect re-binds the conversation automatically —
 * no `ngOnInit`/`ngOnChanges` lifecycle plumbing needed.
 *
 * All user-facing strings are i18n via the `advisor.*` translation namespace.
 */
@Component({
  selector: 'app-advisor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advisor-chat.component.html',
  styleUrls: ['./advisor-chat.component.css'],
})
export class AdvisorChatComponent {
  /** The id of the loan this chat answers questions about. */
  readonly loanId = input.required<string>();

  /** The application store backing the conversation. */
  protected readonly store = inject(AdvisorStore);

  /** Translation service — used to resolve suggestion keys before sending. */
  private readonly translate = inject(TranslateService);

  /** The current draft text bound to the input. */
  protected readonly draft = signal<string>('');

  /**
   * Translation keys for the suggested starter questions.
   * The template renders them via `key | translate`; when a chip is clicked
   * we resolve the current translation value and send that as the question,
   * so the AI always receives the fully-translated sentence.
   */
  protected readonly suggestionKeys: string[] = [
    'advisor.suggestions.totalCost',
    'advisor.suggestions.tcea',
    'advisor.suggestions.monthlyInstallment',
    'advisor.suggestions.initialFee',
  ];

  constructor() {
    // Re-bind the conversation whenever the loan id becomes available or changes.
    // The store ignores empty ids, so the initial '' render is a no-op.
    effect(() => {
      const id = this.loanId();
      if (id) {
        this.store.setLoan(id);
      }
    });
  }

  /**
   * Submits the current draft as a question.
   */
  protected onSend(): void {
    const question = this.draft();
    if (!question.trim() || this.store.busy()) {
      return;
    }
    this.store.ask(question);
    this.draft.set('');
  }

  /**
   * Resolves a suggestion translation key to its current string and sends it.
   *
   * @param key - An `advisor.suggestions.*` i18n key.
   */
  protected onSuggestion(key: string): void {
    if (this.store.busy()) {
      return;
    }
    // instant() is safe here because the language file is already loaded.
    const question = this.translate.instant(key);
    this.store.ask(question);
  }

  /**
   * Submits on Enter (Shift+Enter inserts a newline).
   *
   * @param event - The keyboard event from the textarea.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  /** Clears the conversation. */
  protected onClear(): void {
    this.store.clear();
  }
}

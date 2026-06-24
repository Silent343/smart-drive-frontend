import { Injectable, computed, inject, signal } from '@angular/core';

import { AdvisorApi } from '../infrastructure/advisor-api';
import { ChatMessage } from '../domain/model/chat-message';

/**
 * Application store for the loan advisor conversation.
 *
 * Holds the message list as a signal and orchestrates calls to the advisor
 * API, following the project's signals-based store convention.
 */
@Injectable({ providedIn: 'root' })
export class AdvisorStore {
  private readonly api = inject(AdvisorApi);

  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _loanId = signal<string | null>(null);
  private readonly _busy = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  /** The conversation messages, oldest first. */
  readonly messages = this._messages.asReadonly();
  /** Whether a question is currently being answered. */
  readonly busy = this._busy.asReadonly();
  /** The last error message, or `null`. */
  readonly error = this._error.asReadonly();
  /** Whether a loan is set and questions can be asked. */
  readonly ready = computed(() => this._loanId() !== null);

  /**
   * Binds the conversation to a specific loan.
   *
   * <p>Ignores empty ids (the parent may render before a loan is available)
   * and is idempotent: re-binding to the same loan does nothing, so an effect
   * can call it on every change-detection pass without wiping the history.</p>
   *
   * @param loanId - The id of the loan the user wants to ask about.
   */
  setLoan(loanId: string): void {
    if (!loanId || loanId === this._loanId()) {
      return;
    }
    this._loanId.set(loanId);
    this._messages.set([]);
    this._error.set(null);
  }

  /**
   * Sends a question to the advisor and appends both the user message and the
   * assistant's grounded answer to the conversation.
   *
   * @param question - The user's question.
   */
  ask(question: string): void {
    const trimmed = question.trim();
    const loanId = this._loanId();
    if (!trimmed || !loanId || this._busy()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now().toString(36)}_u`,
      role: 'user',
      content: trimmed,
    };
    const pendingMessage: ChatMessage = {
      id: `msg_${Date.now().toString(36)}_a`,
      role: 'assistant',
      content: '',
      pending: true,
    };

    const history = this._messages();
    this._messages.set([...history, userMessage, pendingMessage]);
    this._busy.set(true);
    this._error.set(null);

    this.api.ask(loanId, trimmed, history).subscribe({
      next: (answer) => {
        this.patchMessage(pendingMessage.id, {
          content: answer.answer,
          pending: false,
        });
        this._busy.set(false);
      },
      error: (err: Error) => {
        this.patchMessage(pendingMessage.id, {
          content: 'No pude responder esa pregunta. Inténtalo de nuevo.',
          pending: false,
        });
        this._error.set(err.message);
        this._busy.set(false);
      },
    });
  }

  /**
   * Clears the conversation history while keeping the bound loan.
   */
  clear(): void {
    this._messages.set([]);
    this._error.set(null);
  }

  /**
   * Updates one message in place by id, re-emitting the messages signal.
   *
   * @param id - The id of the message to update.
   * @param patch - The fields to overwrite.
   */
  private patchMessage(id: string, patch: Partial<ChatMessage>): void {
    this._messages.update((messages) =>
      messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    );
  }
}

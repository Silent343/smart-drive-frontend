import { Injectable, computed, inject, signal } from '@angular/core';

import { AdvisorApi } from '../infrastructure/advisor-api';
import { AdvisorFiguresResource } from '../infrastructure/advisor-response';
import { ChatMessage } from '../domain/model/chat-message';
import { Loan } from '../../sdp/domain/model/loan';
import { SdpStore } from '../../sdp/application/sdp.store';
import { moneySymbol } from '../../sdp/application/currency-conversion';

/**
 * Application store for the loan advisor conversation.
 *
 * Holds the message list as a signal and orchestrates calls to the advisor
 * API, following the project's signals-based store convention.
 */
@Injectable({ providedIn: 'root' })
export class AdvisorStore {
  private readonly api = inject(AdvisorApi);
  private readonly sdpStore = inject(SdpStore);

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
  /**
   * Whether questions can be asked: either a confirmed loan is bound, or a
   * simulation has been calculated (so we have inline figures to ground on).
   */
  readonly ready = computed(
    () => this._loanId() !== null || this.sdpStore.currentLoan() !== null,
  );

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
    if (!trimmed || this._busy()) {
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

    // Ground the answer on real figures: the confirmed loan's id when we have
    // one, otherwise the current simulation's figures sent inline. Sending the
    // figures too lets the backend answer even before the loan is saved.
    const figures = this.buildFigures();

    // Nothing to answer about yet (no confirmed loan and no simulation).
    if (!loanId && !figures) {
      this.patchMessage(pendingMessage.id, {
        content: this.localAnswer(trimmed),
        pending: false,
      });
      this._busy.set(false);
      return;
    }

    this.api.ask(loanId, trimmed, history, figures).subscribe({
      next: (answer) => {
        this.patchMessage(pendingMessage.id, {
          content: answer.answer,
          pending: false,
        });
        this._busy.set(false);
      },
      error: () => {
        // Gemini/backend failed: answer locally with the real simulated figures.
        this.patchMessage(pendingMessage.id, {
          content: this.localAnswer(trimmed),
          pending: false,
        });
        this._error.set(null);
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

  /**
   * Maps the current simulation into the inline figures sent to the backend,
   * so the AI can ground its answer on real numbers before the loan is saved.
   *
   * Rates are converted from fractions to percentages here, which is the
   * convention the backend expects.
   *
   * @returns The figures, or `undefined` when no simulation exists yet.
   */
  private buildFigures(): AdvisorFiguresResource | undefined {
    const loan: Loan | null = this.sdpStore.currentLoan();
    if (!loan) {
      return undefined;
    }
    const config = this.sdpStore.activeCreditConfig();
    return {
      currency_symbol: moneySymbol(config?.currency),
      vehicle_price: loan.vehiclePrice,
      initial_fee: loan.initialFee,
      loan_amount: loan.loanAmount,
      installments_qty: loan.installmentsQty,
      fixed_installment: loan.fixedInstallment,
      tcea_pct: loan.tcea * 100,
      total_interest: loan.totalInterest,
      total_insurance: loan.totalInsurance,
      total_postage: loan.totalPostage,
      total_commission: loan.totalCommission,
      ctc: loan.ctc,
      npv_debtor: loan.npvDebtor,
      irr_debtor_pct: loan.irrDebtor * 100,
    };
  }

  private localAnswer(question: string): string {
    const loan = this.sdpStore.currentLoan();
    const config = this.sdpStore.activeCreditConfig();
    if (!loan) {
      return 'Primero calcula la simulacion para poder responder con cifras del credito.';
    }

    const symbol = moneySymbol(config?.currency);
    const money = (value: number) => `${symbol} ${Number(value || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const lower = question.toLowerCase();
    const totalPaid = loan.loanAmount + loan.ctc;

    if (lower.includes('total') || lower.includes('cost')) {
      return `El costo adicional total del credito (CTC) es ${money(loan.ctc)}. Si sumas capital financiado + CTC, el desembolso financiero de referencia es ${money(totalPaid)}.`;
    }
    if (lower.includes('tcea')) {
      return `La TCEA del credito es ${(loan.tcea * 100).toFixed(2)}%. Resume el costo efectivo anual del financiamiento, incluyendo intereses y costos del credito.`;
    }
    if (lower.includes('monthly') || lower.includes('cuota') || lower.includes('payment')) {
      return `La cuota base es ${money(loan.fixedInstallment)}. El pago mensual incluye amortizacion/interes y cargos como seguros, portes, comisiones, GPS e IGV/ITF segun el cronograma.`;
    }
    if (lower.includes('down') || lower.includes('initial') || lower.includes('inicial')) {
      return `La cuota inicial actual es ${money(loan.initialFee)} y el capital financiado queda en ${money(loan.loanAmount)}. Si aumentas la inicial, baja el capital financiado y normalmente bajan intereses, seguros ligados al saldo y el CTC.`;
    }

    return `Resumen del credito: capital financiado ${money(loan.loanAmount)}, cuota base ${money(loan.fixedInstallment)}, intereses ${money(loan.totalInterest)}, CTC ${money(loan.ctc)} y TCEA ${(loan.tcea * 100).toFixed(2)}%.`;
  }
}

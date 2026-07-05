import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { IamStore } from '../../../../iam/application/iam.store';
import { IamApi, SellerRegistrationResult, SellerResource } from '../../../../iam/infrastructure/iam-api';

@Component({
  selector: 'app-workers-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './workers-page.component.html',
  styleUrl: './workers-page.component.css',
})
export class WorkersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly iamApi = inject(IamApi);
  private readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  readonly sellers = signal<SellerResource[]>([]);
  readonly generatedCredentials = signal<SellerRegistrationResult | null>(null);
  readonly companyDomain = this.iamStore.currentCompanyDomain;
  /** Domain in SmartDrive handle format, e.g. `@rekir.sdf`. */
  readonly displayDomain = this.iamStore.displayDomain;
  readonly domainSlug = computed(() => this.companyDomain() || '');
  readonly error = signal('');
  isLoading = false;
  isSubmitting = false;

  sellerForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    code: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,12}$/)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
  });

  private readonly firstNameValue = toSignal(this.sellerForm.controls.firstName.valueChanges, { initialValue: '' });
  private readonly lastNameValue = toSignal(this.sellerForm.controls.lastName.valueChanges, { initialValue: '' });
  private readonly codeValue = toSignal(this.sellerForm.controls.code.valueChanges, { initialValue: '' });

  /**
   * Builds the seller code automatically from the name: first two letters of the first name +
   * first two letters of the last name + a two-digit sequence based on how many sellers already
   * exist (e.g. "Ana Torres" -> "ANTO01"). The field is read-only, so the admin cannot edit it.
   */
  private readonly autoCodeEffect = effect(() => {
    const first = (this.firstNameValue() || '').replace(/[^A-Za-z]/g, '');
    const last = (this.lastNameValue() || '').replace(/[^A-Za-z]/g, '');
    if (first.length < 2 || last.length < 2) {
      if (this.sellerForm.controls.code.value) {
        this.sellerForm.controls.code.setValue('', { emitEvent: false });
      }
      return;
    }
    const seq = String(this.sellers().length + 1).padStart(2, '0');
    const code = (first.slice(0, 2) + last.slice(0, 2)).toUpperCase() + seq;
    if (this.sellerForm.controls.code.value !== code) {
      this.sellerForm.controls.code.setValue(code, { emitEvent: false });
    }
  });

  /** Live preview of the username the seller will use, e.g. `rekir-ven001`. */
  readonly usernamePreview = computed(() => {
    const code = (this.codeValue() || '').trim().toLowerCase();
    const domain = this.domainSlug();
    return code && domain ? `${domain}-${code}` : '';
  });

  /** Whether a control should show its inline error (invalid and already touched). */
  isInvalid(controlName: string): boolean {
    const control = this.sellerForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Initials used for the avatar chip in the sellers table. */
  initials(fullName: string): string {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    this.isLoading = true;
    this.error.set('');
    this.iamApi.listSellers().subscribe({
      next: sellers => {
        this.sellers.set(sellers);
        this.isLoading = false;
      },
      error: () => {
        this.error.set(this.translate.instant('admin.workers.errors.load'));
        this.isLoading = false;
      },
    });
  }

  registerSeller(): void {
    const raw = this.sellerForm.getRawValue();
    if (this.sellerForm.invalid || !raw.code) {
      this.sellerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error.set('');
    this.iamApi.registerSeller({
      firstName: raw.firstName!.trim(),
      lastName: raw.lastName!.trim(),
      code: raw.code!.trim().toUpperCase(),
      dni: raw.dni!.trim(),
      phone: raw.phone!.trim(),
    }).subscribe({
      next: credentials => {
        this.generatedCredentials.set(credentials);
        this.sellerForm.reset();
        this.loadSellers();
        this.isSubmitting = false;
      },
      error: () => {
        this.error.set(this.translate.instant('admin.workers.errors.register'));
        this.isSubmitting = false;
      },
    });
  }

  copyCredentials(): void {
    const credentials = this.generatedCredentials();
    if (!credentials) return;
    const text = `Username: ${credentials.username}\nInitial password: ${credentials.initialPassword}`;
    navigator.clipboard?.writeText(text);
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SdpStore } from '../../../application/sdp.store';
import { ArmStore } from '../../../../arm/application/arm.store';
import { FlowHeaderComponent } from '../../components/flow-header/flow-header.component';
import { ScheduleTableComponent } from '../../components/schedule-table/schedule-table.component';
import { jsPDF } from 'jspdf';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector:    'app-report-page',
  standalone:  true,
  imports:     [CommonModule, TranslateModule, FlowHeaderComponent, ScheduleTableComponent],
  templateUrl: './report-page.component.html',
  styleUrls:   ['./report-page.component.css'],
})
export class ReportPageComponent implements OnInit {
  private readonly store    = inject(SdpStore);
  private readonly armStore = inject(ArmStore);
  private readonly router   = inject(Router);
  private readonly iamStore = inject(IamStore);

  readonly report    = this.store.currentReport;
  readonly isLoading = this.store.isLoading;


  // Estado del botón confirmar
  isConfirming = false;
  confirmSuccess = false;
  confirmError   = '';

  // Accesos directos
  get loan()     { return this.report()?.loan; }
  get config()   { return this.report()?.config; }
  get schedule() { return this.report()?.schedule ?? this.store.currentSchedule(); }
  get currency() { return this.config?.currency ?? this.store.activeCreditConfig()?.currency ?? 'PEN'; }
  get symbol()   { return this.currency === 'USD' ? '$' : 'S/'; }

  // Datos del flujo
  readonly clientName = this.store.flowClientName;
  readonly carName    = this.store.flowCarName;
  readonly currentUser = this.iamStore.currentUser;

  get vehicleIdsText(): string {
    const ids = this.vehicleIds();
    return ids.length ? ids.join(', ') : '—';
  }

  get vehicleNamesText(): string {
    const selectedVehicles = this.store.flowVehicles();
    if (selectedVehicles.length) {
      return selectedVehicles.map(vehicle => vehicle.label).join(', ');
    }

    const labels = this.vehicleIds().map(vehicleId => this.vehicleLabelById(vehicleId));
    if (labels.length) return labels.join(', ');

    return this.carName() || '—';
  }

  fmt(n: number | undefined): string {
    if (n == null) return '—';
    return `${this.symbol} ${n.toLocaleString('es-PE', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
  }

  fmtPct(n: number | undefined, decimals = 2): string {
    if (n == null) return '—';
    return `${(n * 100).toFixed(decimals)}%`;
  }

  ngOnInit(): void {
    if (!this.report()) {
      const loan     = this.store.currentLoan();
      const config   = this.store.activeCreditConfig();
      const schedule = this.store.currentSchedule();

      if (loan && config && schedule.length > 0) {
        this.store.loadReportByLoan(loan.id);
      } else if (loan?.id) {
        this.store.loadReportByLoan(loan.id);
      }
    }

    // Cargar clientes frescos para tener el objeto completo disponible
    this.armStore.loadClients();
    this.armStore.loadVehicles();
    this.armStore.loadVehicleSpecifications();
  }

  private vehicleIds(): string[] {
    const loan = this.loan;
    if (loan?.vehicles?.length) {
      return loan.vehicles.map(vehicle => vehicle.carId).filter(Boolean);
    }

    const selectedVehicles = this.store.flowVehicles();
    if (selectedVehicles.length) {
      return selectedVehicles.map(vehicle => vehicle.id).filter(Boolean);
    }

    return loan?.carId ? [loan.carId] : [];
  }

  private vehicleLabelById(vehicleId: string): string {
    const vehicle = this.armStore.vehicles().find(v => v.id === vehicleId);
    const spec = this.armStore.vehicleSpecifications().find(s => s.vehicleId === vehicleId);
    if (spec?.brand || spec?.model) return `${spec.brand ?? ''} ${spec.model ?? ''}`.trim();
    return vehicle?.code ?? vehicleId;
  }

  // ── Confirmar: persiste el crédito confirmado para reportes admin ──
  onConfirm(): void {
    const clientId = this.store.flowClientId();
    const carId    = this.store.flowCarId();
    const loan = this.loan;

    if (!clientId || !carId || !loan) {
      this.confirmError = 'No client or vehicle found in the current flow.';
      return;
    }

    const clients = this.armStore.clients();
    const client  = clients.find(c => c.id === clientId);

    if (!client) {
      this.confirmError = 'Client not found in the system.';
      return;
    }

    this.isConfirming  = true;
    this.confirmError  = '';
    this.confirmSuccess = false;

    this.store.confirmCurrentLoan().subscribe({
      next: () => {
        this.armStore.loadVehicles();
        this.isConfirming   = false;
        this.confirmSuccess = true;
      },
      error: () => {
        this.isConfirming = false;
        this.confirmError = 'Could not confirm the credit in the company reports.';
      },
    });
  }

  onNewSimulation(): void {
    this.store.clearAll();
    this.router.navigate(['/configuration']);
  }

  onBack(): void { this.router.navigate(['/schedule']); }

  onExport(): void {
    const loan     = this.loan;
    const config   = this.config;
    const schedule = this.schedule;
    const sym      = this.symbol;

    if (!loan || !config) return;

    const pdf    = new jsPDF('p', 'mm', 'a4');
    const W      = pdf.internal.pageSize.getWidth();   // 210
    const H      = pdf.internal.pageSize.getHeight();  // 297
    const margin = 14;
    const col2   = W / 2 + 2;

    // ── Colores ──────────────────────────────────────────────────
    const GOLD   : [number,number,number] = [180, 140,  60];
    const DARK   : [number,number,number] = [ 30,  30,  40];
    const LIGHT  : [number,number,number] = [245, 246, 248];
    const MID    : [number,number,number] = [200, 200, 210];
    const WHITE  : [number,number,number] = [255, 255, 255];
    const GREEN  : [number,number,number] = [ 40, 120,  80];

    // ── Helpers ──────────────────────────────────────────────────
    const fmt = (n: number | undefined) =>
      n == null ? '—' : `${sym} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fmtPct = (n: number | undefined, d = 4) =>
      n == null ? '—' : `${(n * 100).toFixed(d)}%`;

    let y = 0;

    const newPage = () => {
      pdf.addPage();
      y = 20;
      drawPageHeader();
    };

    const checkY = (needed: number) => {
      if (y + needed > H - 16) newPage();
    };

    // ── Encabezado de página (repetido en cada hoja) ─────────────
    const drawPageHeader = () => {
      pdf.setFillColor(...DARK);
      pdf.rect(0, 0, W, 12, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(...WHITE);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SMARTDRIVE FINANCE', margin, 8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Vehicle Credit Report', W / 2, 8, { align: 'center' });
      pdf.text(new Date().toLocaleDateString('en-US'), W - margin, 8, { align: 'right' });
    };

    // ── Sección título ───────────────────────────────────────────
    const drawSectionTitle = (title: string) => {
      checkY(12);
      pdf.setFillColor(...GOLD);
      pdf.rect(margin, y, W - margin * 2, 7, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...WHITE);
      pdf.text(title.toUpperCase(), margin + 3, y + 5);
      y += 10;
    };

    // ── Fila clave/valor ─────────────────────────────────────────
    const drawRow = (label: string, value: string, x: number, colW: number, shade: boolean) => {
      if (shade) {
        pdf.setFillColor(...LIGHT);
        pdf.rect(x, y - 1, colW, 6.5, 'F');
      }
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(90, 90, 100);
      pdf.text(label, x + 2, y + 4);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DARK);
      pdf.text(value, x + colW - 2, y + 4, { align: 'right' });
      y += 7;
    };

    // ── Par de filas (2 columnas lado a lado) ────────────────────
    const drawRowPair = (
      lLabel: string, lVal: string,
      rLabel: string, rVal: string,
      shade: boolean
    ) => {
      checkY(8);
      const colW = (W - margin * 2) / 2 - 1;
      if (shade) {
        pdf.setFillColor(...LIGHT);
        pdf.rect(margin, y - 1, W - margin * 2, 6.5, 'F');
      }
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(90, 90, 100);
      pdf.text(lLabel, margin + 2, y + 4);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DARK);
      pdf.text(lVal, margin + colW - 2, y + 4, { align: 'right' });

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(90, 90, 100);
      pdf.text(rLabel, col2 + 2, y + 4);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DARK);
      pdf.text(rVal, col2 + colW - 2, y + 4, { align: 'right' });
      y += 7;
    };

    // ════════════════════════════════════════════════════════════
    // PÁGINA 1 — HERO BANNER
    // ════════════════════════════════════════════════════════════
    pdf.setFillColor(...DARK);
    pdf.rect(0, 0, W, 50, 'F');

    // Acento dorado izquierdo
    pdf.setFillColor(...GOLD);
    pdf.rect(0, 0, 4, 50, 'F');

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...WHITE);
    pdf.text('Vehicle Credit Report', margin + 4, 22);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...GOLD);
    pdf.text('SmartDrive Finance — Automotive Credit Solutions', margin + 4, 32);

    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 190);
    pdf.text(`Generated: ${new Date().toLocaleString('en-US')}`, margin + 4, 42);
    pdf.text(`Client ID: ${loan.clientId}   |   Vehicle ID: ${this.vehicleIdsText}`, W - margin, 42, { align: 'right' });

    y = 62;

    // ── CLIENTE & VEHÍCULO ───────────────────────────────────────
    drawSectionTitle('Client & Vehicle Information');
    drawRowPair('Client ID',    loan.clientId  || '—', 'Vehicle ID',    this.vehicleIdsText, false);
    drawRowPair('Client Name',  this.clientName()    , 'Vehicle Name',  this.vehicleNamesText, true);
    drawRowPair('Vehicle Price', fmt(loan.vehiclePrice), 'Initial Fee', fmt(loan.initialFee) , false);

    y += 4;

    // ── PARÁMETROS DE SIMULACIÓN ──────────────────────────────────
    drawSectionTitle('Simulation Parameters');
    drawRowPair('Currency',      config.currency || '—',
      'Rate Type',     config.interestRateType || '—',          false);
    drawRowPair('Annual Rate',   `${config.annualRate}%`,
      'Equivalent TEA', `${config.effectiveAnnualRate.toFixed(4)}%`, true);
    drawRowPair('Term',          `${loan.installmentsQty} months`,
      'Initial Fee',   fmt(loan.initialFee),                    false);
    drawRowPair('Grace Months',  `${config.gracePeriodMonths}`,
      'Grace Type',    config.gracePeriodType || '—',           true);
    drawRowPair('Final Installment', `${config.finalInstallmentPct}%`,
      'Discount Rate', `${config.discountAnnualRatePct}%`, false);

    y += 4;

    // ── RESUMEN FINANCIERO ────────────────────────────────────────
    drawSectionTitle('Financial Summary');
    drawRowPair('Financed Capital', fmt(loan.loanAmount),
      'Total Interest',   fmt(loan.totalInterest),  false);
    drawRowPair('Total Insurance',  fmt(loan.totalInsurance),
      'Total Postage',    fmt(loan.totalPostage),   true);
    drawRowPair('Risk Insurance', fmt(loan.totalRiskInsurance),
      'GPS Total', fmt(loan.totalGps), false);
    drawRowPair('Admin Commission', fmt(loan.totalCommission ?? 0),
      'IGV/ITF Tax', fmt(loan.totalTax), true);
    drawRowPair('Initial Costs', fmt(loan.initialCosts),
      'Residual Value', fmt(loan.residualValue), false);
    drawRowPair('Total Cost (CTC)', fmt(loan.ctc),
      'TREA', fmtPct(loan.trea, 4), true);

    y += 3;

    // KPI destacados (TCEA / IRR / NPV) en cajas
    const kpis = [
      { label: 'TCEA',         value: fmtPct(loan.tcea, 4) },
      { label: 'IRR (monthly)',value: fmtPct(loan.irrDebtor, 4) },
      { label: 'NPV (debtor)', value: fmt(loan.npvDebtor) },
    ];
    const kpiW = (W - margin * 2 - 6) / 3;
    kpis.forEach((k, i) => {
      const kx = margin + i * (kpiW + 3);
      pdf.setFillColor(...DARK);
      pdf.roundedRect(kx, y, kpiW, 18, 2, 2, 'F');
      pdf.setFillColor(...GOLD);
      pdf.roundedRect(kx, y, kpiW, 4, 2, 2, 'F');
      pdf.rect(kx, y + 2, kpiW, 2, 'F');       // flatten bottom of top bar

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...WHITE);
      pdf.text(k.label, kx + kpiW / 2, y + 3, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...GOLD);
      pdf.text(k.value, kx + kpiW / 2, y + 14, { align: 'center' });
    });
    y += 24;

    // ════════════════════════════════════════════════════════════
    // PÁGINA(S) — TABLA DE CRONOGRAMA
    // ════════════════════════════════════════════════════════════
    newPage();
    drawSectionTitle('Amortization Schedule');
    y += 1;

    // Cabecera de tabla
    const cols = [
      { header: '#',           w: 10 },
      { header: 'Date',        w: 22 },
      { header: 'Open Bal.',   w: 26 },
      { header: 'Interest',    w: 24 },
      { header: 'Amort.',      w: 24 },
      { header: 'Insurance',   w: 22 },
      { header: 'Postage',     w: 18 },
      { header: 'Commission',  w: 22 },
      { header: 'Payment',     w: 24 },
      { header: 'Close Bal.',  w: 26 },
    ];
    // Total ancho = 218 → ajustamos a W - 2*margin = 182
    const totalW = cols.reduce((s, c) => s + c.w, 0);
    const scale  = (W - margin * 2) / totalW;
    cols.forEach(c => c.w = c.w * scale);

    const drawTableHeader = () => {
      pdf.setFillColor(...DARK);
      pdf.rect(margin, y, W - margin * 2, 7, 'F');
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...WHITE);
      let cx = margin;
      cols.forEach(c => {
        pdf.text(c.header, cx + c.w / 2, y + 5, { align: 'center' });
        cx += c.w;
      });
      y += 8;
    };

    drawTableHeader();

    schedule.forEach((row, idx) => {
      checkY(7);

      // Si checkY agregó página, redibujar cabecera de tabla
      if (y <= 22) drawTableHeader();

      const shade = idx % 2 === 0;
      if (shade) {
        pdf.setFillColor(...LIGHT);
        pdf.rect(margin, y - 1, W - margin * 2, 6.5, 'F');
      }

      // Grace period badge
      const isGrace = row.gracePeriodType && row.gracePeriodType !== 'none';
      if (isGrace) {
        pdf.setFillColor(255, 243, 205);
        pdf.rect(margin, y - 1, W - margin * 2, 6.5, 'F');
      }

      const dateStr = row.paymentDate
        ? new Date(row.paymentDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit', day: '2-digit' })
        : '—';

      const cells = [
        row.installmentNo?.toString() ?? '—',
        dateStr,
        fmt(row.openingBalance),
        fmt(row.interest),
        fmt(row.amortization),
        fmt(row.insurance),
        fmt(row.postage),
        fmt(row.commission),
        fmt(row.monthlyPayment),
        fmt(row.endingBalance),
      ];

      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DARK);

      let cx = margin;
      cells.forEach((cell, ci) => {
        const align = ci === 0 || ci === 1 ? 'center' : 'right';
        pdf.text(cell, ci === 0 || ci === 1
            ? cx + cols[ci].w / 2
            : cx + cols[ci].w - 1,
          y + 4,
          { align }
        );
        cx += cols[ci].w;
      });

      y += 6.5;
    });

    // ── Fila TOTAL ────────────────────────────────────────────────
    checkY(10);
    pdf.setFillColor(...DARK);
    pdf.rect(margin, y, W - margin * 2, 8, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...GOLD);

    const totals = [
      'TOTAL', '',
      '',
      fmt(loan.totalInterest),
      fmt(loan.loanAmount),
      fmt(loan.totalInsurance),
      fmt(loan.totalPostage),
      fmt(loan.totalCommission ?? 0),
      fmt(loan.ctc),
      '',
    ];
    let cx2 = margin;
    totals.forEach((t, i) => {
      if (t) pdf.text(t, i < 2 ? cx2 + cols[i].w / 2 : cx2 + cols[i].w - 1, y + 5.5,
        { align: i < 2 ? 'center' : 'right' });
      cx2 += cols[i].w;
    });
    y += 10;

    // ════════════════════════════════════════════════════════════
    // PIE DE PÁGINA en todas las páginas
    // ════════════════════════════════════════════════════════════
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFillColor(...MID);
      pdf.rect(0, H - 10, W, 10, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 90);
      pdf.text('SmartDrive Finance — Confidential document', margin, H - 4);
      pdf.text(`Page ${p} of ${totalPages}`, W - margin, H - 4, { align: 'right' });
    }

    pdf.save(`Credit_Report_${loan.clientId || 'Client'}_${Date.now()}.pdf`);
  }















  async onExportExcel(): Promise<void> {
    const loan = this.loan;
    const config = this.config;
    const schedule = this.schedule;

    if (!loan || !config) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Credit Report', {
      views: [{ showGridLines: false }] // Oculta las líneas de fondo por defecto para verse más limpio
    });

    // Paleta de colores basada en tu diseño
    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E28' } }; // DARK
    const goldFill: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB48C3C' } }; // GOLD
    const lightFill: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F6F8' } }; // LIGHT
    const graceFill: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }; // Amarillo aviso

    const whiteFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Helvetica' };
    const goldFont: Partial<ExcelJS.Font>  = { color: { argb: 'FFB48C3C' }, bold: true, name: 'Helvetica' };
    const darkFont: Partial<ExcelJS.Font>  = { color: { argb: 'FF1E1E28' }, bold: true, name: 'Helvetica' };
    const normalFont: Partial<ExcelJS.Font> = { color: { argb: 'FF5A5A64' }, name: 'Helvetica' };

    // Formatos nativos de Excel
    const currencyFmt = `"${this.symbol}"#,##0.00;[Red]\-"${this.symbol}"#,##0.00`;
    const pctFmt = '0.0000%';

    // Helper para subtítulos
    const addSectionTitle = (title: string, rowIdx: number) => {
      ws.mergeCells(`A${rowIdx}:J${rowIdx}`);
      const cell = ws.getCell(`A${rowIdx}`);
      cell.value = title.toUpperCase();
      cell.fill = goldFill;
      cell.font = whiteFont;
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    };

    // --- ENCABEZADO ---
    ws.mergeCells('A1:J2');
    const mainTitle = ws.getCell('A1');
    mainTitle.value = 'SMARTDRIVE FINANCE - VEHICLE CREDIT REPORT';
    mainTitle.fill = headerFill;
    mainTitle.font = { color: { argb: 'FFFFFFFF' }, size: 14, bold: true, name: 'Helvetica' };
    mainTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- BLOQUE 1: CLIENTE Y VEHÍCULO ---
    addSectionTitle('Client & Vehicle Information', 4);
    ws.getRow(5).values = ['Client ID', loan.clientId || '—', '', 'Vehicle ID', this.vehicleIdsText];
    ws.getRow(6).values = ['Client Name', this.clientName(), '', 'Vehicle Name', this.vehicleNamesText];
    ws.getRow(7).values = ['Vehicle Price', loan.vehiclePrice, '', 'Initial Fee', loan.initialFee];

    // --- BLOQUE 2: PARÁMETROS ---
    addSectionTitle('Simulation Parameters', 9);
    ws.getRow(10).values = ['Currency', config.currency || '—', '', 'Rate Type', config.interestRateType || '—'];
    ws.getRow(11).values = ['Annual Rate', config.annualRate / 100, '', 'Equivalent TEA', config.effectiveAnnualRate / 100];
    ws.getRow(12).values = ['Term (Months)', loan.installmentsQty, '', 'Grace Type', config.gracePeriodType || '—'];
    ws.getRow(13).values = ['Grace Months', config.gracePeriodMonths];
    ws.getRow(14).values = ['Final Installment', config.finalInstallmentPct / 100, '', 'Discount Annual Rate', config.discountAnnualRatePct / 100];

    // --- BLOQUE 3: RESUMEN FINANCIERO ---
    addSectionTitle('Financial Summary', 16);
    ws.getRow(17).values = ['Financed Capital', loan.loanAmount, '', 'Total Interest', loan.totalInterest];
    ws.getRow(18).values = ['Total Insurance', loan.totalInsurance, '', 'Risk Insurance', loan.totalRiskInsurance];
    ws.getRow(19).values = ['Total GPS', loan.totalGps, '', 'Total Postage', loan.totalPostage];
    ws.getRow(20).values = ['Admin Commission', loan.totalCommission ?? 0, '', 'IGV/ITF Tax', loan.totalTax];
    ws.getRow(21).values = ['Initial Costs', loan.initialCosts, '', 'Residual Value', loan.residualValue];
    ws.getRow(22).values = ['Total Cost (CTC)', loan.ctc, '', 'TREA', loan.trea];
    ws.getRow(24).values = ['TCEA', loan.tcea, '', 'IRR (monthly)', loan.irrDebtor];
    ws.getRow(25).values = ['NPV (debtor)', loan.npvDebtor];
    // Aplicar estilos a las tablas de resumen (Negritas, alineaciones y formatos)
    [5,6,7, 10,11,12,13,14, 17,18,19,20,21,22, 24,25].forEach(r => {
      const row = ws.getRow(r);
      row.getCell(1).font = normalFont;
      row.getCell(2).font = darkFont;
      row.getCell(4).font = normalFont;
      row.getCell(5).font = darkFont;

      if (r % 2 === 0 && r !== 20) { // Alternar sombreado ligero
        row.getCell(1).fill = lightFill; row.getCell(2).fill = lightFill;
        row.getCell(4).fill = lightFill; row.getCell(5).fill = lightFill;
      }
    });

    // Formatos de celda del resumen
    ws.getCell('B7').numFmt = currencyFmt; ws.getCell('E7').numFmt = currencyFmt;
    ws.getCell('B11').numFmt = pctFmt;     ws.getCell('E11').numFmt = pctFmt;
    ws.getCell('B14').numFmt = pctFmt;     ws.getCell('E14').numFmt = pctFmt;
    ws.getCell('B17').numFmt = currencyFmt; ws.getCell('E17').numFmt = currencyFmt;
    ws.getCell('B18').numFmt = currencyFmt; ws.getCell('E18').numFmt = currencyFmt;
    ws.getCell('B19').numFmt = currencyFmt; ws.getCell('E19').numFmt = currencyFmt;
    ws.getCell('B20').numFmt = currencyFmt; ws.getCell('E20').numFmt = currencyFmt;
    ws.getCell('B21').numFmt = currencyFmt; ws.getCell('E21').numFmt = currencyFmt;
    ws.getCell('B22').numFmt = currencyFmt; ws.getCell('E22').numFmt = pctFmt;
    ws.getCell('B24').numFmt = pctFmt;     ws.getCell('E24').numFmt = pctFmt;
    ws.getCell('B25').numFmt = currencyFmt;

    // --- CRONOGRAMA DE PAGOS ---
    const startRow = 29;
    addSectionTitle('Amortization Schedule', startRow);

    const headers = ['#', 'Date', 'Opening Bal.', 'Interest', 'Amort.', 'Insurance', 'Postage', 'Commission', 'Payment', 'Closing Bal.'];
    const headerRow = ws.getRow(startRow + 1);
    headerRow.values = headers;

    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = whiteFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let currentRow = startRow + 2;
    schedule.forEach((item, index) => {
      const isGrace = item.gracePeriodType && item.gracePeriodType !== 'none';
      const row = ws.getRow(currentRow);

      row.values = [
        item.installmentNo,
        item.paymentDate ? new Date(item.paymentDate) : '',
        item.openingBalance,
        item.interest,
        item.amortization,
        item.insurance,
        item.postage,
        item.commission,
        item.monthlyPayment,
        item.endingBalance
      ];

      // Formato fecha y moneda
      row.getCell(2).numFmt = 'dd-mmm-yyyy';
      for (let c = 3; c <= 10; c++) {
        row.getCell(c).numFmt = currencyFmt;
      }

      // Sombreado de filas
      if (isGrace) {
        row.eachCell(cell => cell.fill = graceFill);
      } else if (index % 2 !== 0) {
        row.eachCell(cell => cell.fill = lightFill);
      }

      // Fuente
      row.eachCell(cell => cell.font = normalFont);
      row.getCell(1).alignment = { horizontal: 'center' };

      currentRow++;
    });

    // --- FILA DE TOTALES ---
    const totalRow = ws.getRow(currentRow);
    totalRow.values = [
      'TOTAL', '', '',
      loan.totalInterest, loan.loanAmount, loan.totalInsurance,
      loan.totalPostage, loan.totalCommission ?? 0, loan.ctc, ''
    ];
    totalRow.eachCell((cell, colNum) => {
      cell.fill = headerFill;
      cell.font = goldFont;
      if (colNum > 3) cell.numFmt = currencyFmt;
    });

    // Ajustar anchos de columna globales
    ws.getColumn(1).width = 8;
    ws.getColumn(2).width = 18;
    for (let c = 3; c <= 10; c++) ws.getColumn(c).width = 16;
    ws.getColumn(3).width = 5; // Separador en el área de resumen

    // Escribir el buffer y desencadenar la descarga
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Credit_Report_${loan.clientId || 'Client'}_${Date.now()}.xlsx`);
  }
}

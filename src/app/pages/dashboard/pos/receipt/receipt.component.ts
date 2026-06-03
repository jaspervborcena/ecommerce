import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrintServiceWeb } from '../../../../services/print.service.web';
import { generateReceiptPreviewText, generateESCPOSCommands } from '../../../../services/escpos-utils';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.css']
})
export class ReceiptComponent implements OnInit {
  @ViewChild('printBtn', { read: ElementRef }) printBtn?: ElementRef<HTMLButtonElement>;
  private hasFocusedPrint = false;
  @Input() isVisible: boolean = false;
  @Input() receiptData: any = null;

  // Converts receiptDate (any format) to a local-time Date for display
  get localReceiptDate(): Date {
  const val = this.receiptData?.receiptDate;
  if (!val) return new Date();

  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate(); // Firestore Timestamp

  if (typeof val === 'string') {
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(val);

    if (!hasTimezone && val.includes('T')) {
      // Parse manually to force local time
      const [datePart, rawTime] = val.split('T');
      const [y, mo, d] = datePart.split('-').map(Number);
      const [h = 0, m = 0, sFull = '0'] = rawTime.split(':');
      const s = Math.floor(parseFloat(sFull));
      return new Date(y, mo - 1, d, Number(h), Number(m), s);
    }

    // If it has timezone info, let JS handle it
    return new Date(val);
  }

  return new Date(val);
}


  // Returns the branch name, preferring storeInfo.branchName, then order.branchName
  getBranchName(): string {
    // Try storeInfo.branchName first
    const storeBranch = this.receiptData?.storeInfo?.branchName;
    if (storeBranch && storeBranch.trim() !== '') {
      return storeBranch;
    }
    // Fallback to order.branchName if available
    const orderBranch = this.receiptData?.order?.branchName || this.receiptData?.branchName;
    if (orderBranch && orderBranch.trim() !== '') {
      return orderBranch;
    }
    return '';
  }
  @Output() closeModal = new EventEmitter<void>();
  @Output() printReceipt = new EventEmitter<void>(); // Simplified - no printer type needed

  isPrinting: boolean = false;
  printerPreviewText: string = '';
  escposCommands: string = '';
  private previewLineChars: number = 32;

  private printService = inject(PrintServiceWeb);
  private sanitizer = inject(DomSanitizer);

  ngOnInit() {
  }

  ngAfterViewChecked(): void {
    if (this.isVisible && this.printBtn && !this.hasFocusedPrint) {
      try {
        this.printBtn.nativeElement.focus();
      } catch (e) {
        // ignore
      }
      this.hasFocusedPrint = true;
    }

    if (this.isVisible && !this.printerPreviewText) {
      this.generatePrinterPreview();
    }

    if (!this.isVisible) {
      this.hasFocusedPrint = false;
      this.printerPreviewText = '';
    }
  }

  private generatePrinterPreview(): void {
    try {
      const paperConfig = this.printService.getPaperSizeConfig();
      this.previewLineChars = paperConfig.lineChars;
      this.printerPreviewText = generateReceiptPreviewText(this.receiptData || {}, paperConfig);
      this.escposCommands = generateESCPOSCommands(this.receiptData || {}, paperConfig);
    } catch (error) {
      console.error('Error generating printer preview:', error);
      this.printerPreviewText = 'Error generating printer preview';
      this.escposCommands = 'Error generating ESC/POS commands';
    }
  }

  formatPrinterPreview(): string {
    const cleaned = this.printerPreviewText.replace(/ù/g, '').replace(/\r/g, '');
    return this.wrapPreviewText(cleaned, this.previewLineChars);
  }

  formatPrinterPreviewHtml(): SafeHtml {
    const cleaned = (this.printerPreviewText || '').replace(/ù/g, '').replace(/\r/g, '');
    const wrapped = this.wrapPreviewText(cleaned, this.previewLineChars);
    const lines = wrapped.split('\n');
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const firstNonEmpty = lines.findIndex(l => l.trim().length > 0);

    const rightAlignedKeys = ['Vatable Sales:', 'Subtotal:', 'VAT Amount:', 'VAT Exempt:', 'Discount:', 'Net Amount:', 'TOTAL:'];

    const boldKeywords = [
      'Invoice #', 'Sales Invoice', 'SALES INVOICE', 'Payment:', 'SOLD TO:', 'Cashier:', 'Date:',
      'Product', 'Qty', 'Amount', 'Total'
    ];

    const looksLikeItemLine = (ln: string) => {
      // item lines contain a currency symbol and a numeric total at the end
      return /₱\d+\.\d{2}$/.test(ln.trim()) || /\d+\.\d{2}$/.test(ln.trim());
    };

    const rightAlignHtml = (label: string) => {
      const escaped = escape(label);
      const padCount = Math.max(0, this.previewLineChars - label.length);
      const padding = '&nbsp;'.repeat(padCount);
      return `<b>${padding}${escaped}</b>`;
    };

    const htmlLines = lines.map((ln, idx) => {
      const raw = ln;
      const trimmed = raw.trim();
      if (trimmed.length === 0) return escape(raw);

      // Right-align totals and similar lines in the right pane
      for (const rk of rightAlignedKeys) {
        if (trimmed.startsWith(rk)) {
          return rightAlignHtml(trimmed);
        }
      }

      // Bold first non-empty line (store name)
      if (idx === firstNonEmpty) return `<b>${escape(raw)}</b>`;

      // Bold branch line if it starts with 'Branch:'
      if (trimmed.startsWith('Branch:')) return `<b>${escape(raw)}</b>`;

      // Bold if contains any of the keywords
      for (const kw of boldKeywords) {
        if (raw.indexOf(kw) !== -1) return `<b>${escape(raw)}</b>`;
      }

      // Bold item first lines (contain currency at end)
      if (looksLikeItemLine(raw)) return `<b>${escape(raw)}</b>`;

      return escape(raw);
    });
    const html = htmlLines.join('\n');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private wrapPreviewText(text: string, width: number): string {
    return text
      .split('\n')
      .map(line => this.wrapLine(line, width))
      .flat()
      .join('\n');
  }

  private wrapLine(line: string, width: number): string[] {
    const trimmed = line.replace(/[\t]/g, '    ');
    if (trimmed.length <= width) {
      return [trimmed];
    }

    const words = trimmed.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      if (!current) {
        current = word;
        continue;
      }

      if ((current + ' ' + word).length <= width) {
        current += ' ' + word;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  onCloseModal() {
    this.closeModal.emit();
  }

  onPrintReceipt(event?: Event) {
    if (event) {
      try { event.preventDefault(); event.stopPropagation(); } catch {}
    }
    if (this.isPrinting) return; // Prevent double-clicking

    this.isPrinting = true;
    this.printReceipt.emit(); // Simplified - smart print will handle everything

    // Reset printing state after a delay (will be reset when modal closes anyway)
    setTimeout(() => {
      this.isPrinting = false;
    }, 3000);
  }

  // Prevent modal from closing when clicking inside
  onModalContentClick(event: Event) {
    event.stopPropagation();
  }

  // Helper method to format quantity with unit type
  formatQuantityWithUnit(quantity: number, unitType?: string): string {
    if (!unitType || unitType === 'N/A') {
      return quantity.toString();
    }
    
    const unitDisplay = unitType === 'pieces' ? 'pc(s)' : unitType;
    return `${quantity} ${unitDisplay}`;
  }

  // Get customer display name with fallback to discount customer name
  getCustomerDisplayName(): string {
    // First check if we have a customer name from sold-to
    if (this.receiptData?.customerName && 
        this.receiptData.customerName !== 'N/A' && 
        this.receiptData.customerName !== 'Walk-in Customer') {
      return this.receiptData.customerName;
    }
    
    // Fallback to discount customer name if available
    if (this.receiptData?.orderDiscount?.customerName) {
      return this.receiptData.orderDiscount.customerName;
    }
    
    // Default fallback
    return 'Walk-in Customer';
  }

  // If multiple customer names present, return them as a single display string
  getAllCustomerNamesDisplay(): string {
    try {
      if (Array.isArray(this.receiptData?.customerNames) && this.receiptData.customerNames.length > 0) {
        return this.receiptData.customerNames.join(', ');
      }
      return this.getCustomerDisplayName();
    } catch (e) {
      return this.getCustomerDisplayName();
    }
  }

  // Check if we have customer details to show (address/TIN)
  hasCustomerDetails(): boolean {
    const customerName = this.getCustomerDisplayName();
    
    // Only show details if we have a real customer name (not Walk-in Customer) and either address or TIN
    return customerName !== 'Walk-in Customer' && 
           ((this.receiptData?.customerAddress && this.receiptData.customerAddress !== 'N/A') ||
            (this.receiptData?.customerTin && this.receiptData.customerTin !== 'N/A'));
  }
}

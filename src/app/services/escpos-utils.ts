/**
 * Shared ESC/POS Command Generator
 * Centralizes receipt format logic for consistent output across Android and Web platforms
 * Ensures cash drawer command is always appended at the end
 */

import { PaperSizeConfig } from './print.service.android';

/**
 * Generate ESC/POS commands for thermal printer (unified for all platforms)
 * @param receiptData - The receipt data object
 * @param paperConfig - Paper size configuration
 * @returns ESC/POS command string with cash drawer command at the end
 */
export function generateESCPOSCommands(receiptData: any, paperConfig: PaperSizeConfig): string {
  let commands = '';
  
  const lineChars = paperConfig.lineChars;
  
  console.log(`≡ƒôä Generating unified ESC/POS for ${paperConfig.width} paper (${lineChars} chars/line)`);
  
  // Generate separator line based on paper width
  const separatorLine = '-'.repeat(lineChars) + '\n';
  const doubleSeparatorLine = '='.repeat(lineChars) + '\n';
  
  // Initialize printer with better quality settings
  commands += '\x1B\x40'; // Initialize
  commands += '\x1D\x21\x00'; // Normal font size (not condensed)
  commands += '\x1B\x4D\x00'; // Font A (clearer than Font B)
  commands += '\x1B\x7B\x32'; // Increase print density for darker text
  
  // Store header - CENTERED and LARGER (same as Sales Invoice)
  commands += '\x1B\x61\x01'; // Center alignment
  commands += '\x1B\x45\x01'; // Bold on
  commands += (receiptData?.storeInfo?.storeName || 'Store Name') + '\n';
  // Add branch name if it exists and is not empty
  if (receiptData?.storeInfo?.branchName && receiptData.storeInfo.branchName.trim() !== '') {
    commands += `Branch: ${receiptData.storeInfo.branchName}\n`;
  }
  commands += '\x1B\x45\x00'; // Bold off
  
  // Store details - CENTERED with normal font
  commands += (receiptData?.storeInfo?.address || 'Store Address') + '\n';
  commands += `Tel: ${receiptData?.storeInfo?.phone || 'N/A'}\n`;
  commands += `Email: ${receiptData?.storeInfo?.email || 'N/A'}\n`;
  commands += `TIN: ${receiptData?.storeInfo?.tin || 'N/A'}\n`;
  
  // BIR Information
  if (receiptData?.storeInfo?.birPermitNo) {
    commands += `BIR: ${receiptData.storeInfo.birPermitNo}\n`;
  }
  if (receiptData?.storeInfo?.inclusiveSerialNumber) {
    commands += `SN: ${receiptData.storeInfo.inclusiveSerialNumber}\n`;
  }
  if (receiptData?.storeInfo?.minNumber) {
    commands += `MIN: ${receiptData.storeInfo.minNumber}\n`;
  }
  
  commands += `Invoice #: ${receiptData?.invoiceNumber || 'Auto-generated'}\n`;
  
  // Invoice Type (centered, bold, slightly larger)
  commands += '\x1D\x21\x01'; // Double height for invoice type
  commands += '\x1B\x45\x01'; // Bold on
  commands += (receiptData?.storeInfo?.invoiceType || 'SALES INVOICE') + '\n';
  commands += '\x1B\x45\x00'; // Bold off
  commands += '\x1D\x21\x00'; // Back to normal size
  commands += '\x1B\x61\x00'; // Left alignment for rest
  
  commands += separatorLine;
  
  // Payment Method - single-line
  const isCashSale = receiptData?.isCashSale !== false; // Default to true unless explicitly false
  const isChargeSale = receiptData?.isChargeSale === true; // Only true if explicitly set
  const paymentMethod = isCashSale ? 'Cash' : (isChargeSale ? 'Charge' : 'N/A');
  commands += '\x1B\x45\x01'; // Bold for payment method
  commands += `Payment: ${paymentMethod}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  commands += separatorLine;
  
  // Customer info - BOLD for sold to
  commands += '\x1B\x45\x01'; // Bold on
  const customerName = receiptData?.customerName || 'Walk-in Customer';
  commands += `SOLD TO: ${customerName}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  if (receiptData?.customerName && receiptData.customerName !== 'Walk-in Customer') {
    if (receiptData?.customerAddress && receiptData?.customerAddress !== 'N/A') {
      commands += `Address: ${receiptData.customerAddress}\n`;
    }
    if (receiptData?.customerTin && receiptData?.customerTin !== 'N/A') {
      commands += `TIN: ${receiptData.customerTin}\n`;
    }
  }
  
  commands += separatorLine;
  
  // Date and Cashier - BOLD
  commands += '\x1B\x45\x01'; // Bold on
  commands += `Cashier: ${receiptData?.cashier || 'N/A'}\n`;
  const date = new Date(receiptData?.receiptDate || new Date());
  commands += `${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  commands += separatorLine;
  
  // Items header - BOLD and clearer (adapt to paper width)
  commands += '\x1B\x45\x01'; // Bold on
  // Dynamic header based on paper size
  const qtyColWidth = 4;
  const totalColWidth = 10;
  const productColWidth = lineChars - qtyColWidth - totalColWidth - 2; // -2 for spaces
  const itemsHeader = 'Qty'.padEnd(qtyColWidth) + 'Product Name'.padEnd(productColWidth) + 'Total'.padStart(totalColWidth);
  commands += itemsHeader + '\n';
  commands += '\x1B\x45\x00'; // Bold off
  commands += separatorLine;
  
  if (receiptData?.items) {
    receiptData.items.forEach((item: any) => {
      const qty = (item.quantity || 1).toString();
      const unitType = item.unitType && item.unitType !== 'N/A' ? ` ${item.unitType.substring(0, 2)}` : '';
      const total = (item.total || 0).toFixed(2);
      
      // Dynamic formatting based on paper width
      const qtyWithUnit = `${qty}${unitType}`;
      const qtyPadded = qtyWithUnit.padEnd(qtyColWidth);
      
      // Product name - limited to fit paper width
      const maxProductNameLength = productColWidth - 1;
      const productName = (item.productName || item.name || 'Item').substring(0, maxProductNameLength);
      const productPadded = productName.padEnd(maxProductNameLength);
      
      // Total - right aligned
      const totalPadded = total.padStart(totalColWidth);
      
      // Make item lines slightly bolder
      commands += '\x1B\x45\x01'; // Bold on for item
      commands += `${qtyPadded} ${productPadded} ${totalPadded}\n`;
      commands += '\x1B\x45\x00'; // Bold off

      // SKU on separate indented line (show SKU after product name)
      const skuLine = `    SKU: ${item.skuId || item.productId || ''}`;
      commands += `${skuLine}\n`;

      // Unit price on separate line, indented
      const unitPrice = (item.sellingPrice || item.price || 0).toFixed(2);
      commands += `    @ ${unitPrice} each\n`;
    });
  }
  
  commands += separatorLine;
  
  // Totals - Right aligned with dynamic width and BOLD amounts
  const receiptWidth = lineChars; // Use dynamic width based on paper size
  
  // Subtotal - always show (BOLD)
  commands += '\x1B\x45\x01'; // Bold on
  const subtotalAmt = (receiptData?.subtotal || 0).toFixed(2);
  const subtotalLine = `Subtotal: ${subtotalAmt}`;
  const subtotalSpaces = ' '.repeat(receiptWidth - subtotalLine.length);
  commands += `${subtotalSpaces}${subtotalLine}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  // VAT (12%) - always show (BOLD)
  commands += '\x1B\x45\x01'; // Bold on
  const vatAmt = (receiptData?.vatAmount || 0).toFixed(2);
  const vatLine = `VAT (12%): ${vatAmt}`;
  const vatSpaces = ' '.repeat(receiptWidth - vatLine.length);
  commands += `${vatSpaces}${vatLine}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  // VAT Exempt - always show (BOLD)
  commands += '\x1B\x45\x01'; // Bold on
  const vatExemptAmt = (receiptData?.vatExempt || 0).toFixed(2);
  const vatExemptLine = `VAT Exempt: ${vatExemptAmt}`;
  const vatExemptSpaces = ' '.repeat(Math.max(0, receiptWidth - vatExemptLine.length));
  commands += `${vatExemptSpaces}${vatExemptLine}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  // Discount - always show (BOLD)
  commands += '\x1B\x45\x01'; // Bold on
  const discountAmt2 = (receiptData?.discount || 0).toFixed(2);
  const discountLine = `Discount: ${discountAmt2}`;
  const discountSpaces = ' '.repeat(Math.max(0, receiptWidth - discountLine.length));
  commands += `${discountSpaces}${discountLine}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  commands += doubleSeparatorLine;
  // Total - DOUBLE SIZE and BOLD
  commands += '\x1D\x21\x11'; // Double height and width
  commands += '\x1B\x45\x01'; // Bold on
  const totalAmt = (receiptData?.totalAmount || receiptData?.netAmount || 0).toFixed(2);
  const totalLine = `TOTAL: ${totalAmt}`;
  const totalSpaces = ' '.repeat(Math.max(0, Math.floor(receiptWidth / 2) - totalLine.length));
  commands += `${totalSpaces}${totalLine}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  commands += '\x1D\x21\x00'; // Back to normal size
  commands += doubleSeparatorLine;
  
  // Discount Information (for PWD/Senior/Special Discounts)
  if (receiptData?.orderDiscount) {
    commands += '\n';
    commands += 'DISCOUNT INFORMATION\n';
    commands += separatorLine;
    
    let discountType = receiptData.orderDiscount.type;
    if (receiptData.orderDiscount.customType) {
      discountType += ` (${receiptData.orderDiscount.customType})`;
    }
    commands += `${discountType} Discount\n`;
    
    if (receiptData.orderDiscount.exemptionId) {
      commands += `ID: ${receiptData.orderDiscount.exemptionId}\n`;
    }
    
    if (receiptData.orderDiscount.customerName) {
      commands += `Customer: ${receiptData.orderDiscount.customerName}\n`;
    }
    
    const discountAmt = (receiptData?.discount || 0).toFixed(2);
    commands += `Discount Amount: ${discountAmt}\n`;
    
    // Signature line for PWD/Senior discounts
    if (receiptData.orderDiscount.type === 'PWD' || receiptData.orderDiscount.type === 'SENIOR') {
      commands += '\n';
      commands += 'Customer Signature:\n';
      if (receiptData.orderDiscount.signature) {
        commands += `${receiptData.orderDiscount.signature}\n`;
      } else {
        commands += '_________________________\n';
      }
    }
    commands += doubleSeparatorLine;
  }
  
  // Validity Notice - CENTERED
  if (receiptData?.validityNotice) {
    commands += '\x1B\x61\x01'; // Center alignment
    commands += '\n';
    commands += receiptData.validityNotice + '\n';
    commands += '\x1B\x61\x00'; // Reset alignment
    commands += '\n';
  }
  
  // Thank you message - CENTERED for Xprinter
  commands += '\x1B\x61\x01'; // Center alignment
  commands += 'Thank you for your purchase!\n';
  commands += 'Please come again.\n';
  commands += '\x1B\x61\x00'; // Reset alignment
  commands += '\n\n\n\n'; // Extra feed for complete printing
  commands += '\x1D\x56\x41'; // Cut paper
  
  // ✅ ALWAYS APPEND CASH DRAWER COMMAND AT THE END
  // This ensures the cash drawer opens on both Android and Web platforms
  commands += '\x1B\x70\x00\x19\xF9'; // Open cash drawer (pin 2, activation)
  
  return commands;
}

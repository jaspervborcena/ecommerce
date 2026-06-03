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
  
  // Clear any junk from printer buffer with form feed
  commands += '\x0C'; // Form feed - clears page and positions at top
  
  // Initialize printer with better quality settings
  commands += '\x1B\x40'; // Initialize
  commands += '\x1D\x21\x00'; // Normal font size (not condensed)
  commands += '\x1B\x4D\x00'; // Font A (clearer than Font B)
  
  // Helper: sanitize text for ESC/POS printing
  const sanitizeText = (input: any) => {
    if (input === null || input === undefined) return '';
    let s = String(input);
    // Replace common typographic characters with ASCII equivalents
    s = s.replace(/\u2018|\u2019|\u201A|\u201B/g, "'")
         .replace(/\u201C|\u201D|\u201E/g, '"')
         .replace(/\u2013|\u2014/g, '-')
         .replace(/\u2026/g, '...')
         .replace(/\u02C6/g, '^');
    // Normalize and strip diacritics (é -> e)
    try { s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    // Remove non-ASCII characters so the printer only receives safe bytes
    s = s.replace(/[^\x00-\x7F]/g, '');
    // Remove control characters except LF (\n) and CR (\r)
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    // Trim leading/trailing whitespace
    return s.trim();
  };

  const wrapText = (text: string, width: number): string[] => {
    const sanitized = sanitizeText(text);
    if (!sanitized) return [''];

    const words = sanitized.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      if (word.length > width) {
        if (current) {
          lines.push(current);
          current = '';
        }
        let idx = 0;
        while (idx < word.length) {
          lines.push(word.substring(idx, idx + width));
          idx += width;
        }
        continue;
      }

      if (!current) {
        current = word;
      } else if ((current.length + 1 + word.length) <= width) {
        current += ' ' + word;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines;
  };

  const padRight = (text: string, width: number) => {
    const sanitized = sanitizeText(text);
    return sanitized.length >= width ? sanitized.substring(0, width) : sanitized + ' '.repeat(width - sanitized.length);
  };

  const padLeft = (text: string, width: number) => {
    const sanitized = sanitizeText(text);
    return sanitized.length >= width ? sanitized.substring(0, width) : ' '.repeat(width - sanitized.length) + sanitized;
  };

  const centerText = (text: string) => {
    const sanitized = sanitizeText(text);
    if (!sanitized) return '';
    if (sanitized.length >= lineChars) return sanitized;
    const padding = Math.floor((lineChars - sanitized.length) / 2);
    return ' '.repeat(padding) + sanitized;
  };


  // Store header - CENTERED and LARGER (same as Sales Invoice)
  commands += '\x1B\x61\x01'; // Center alignment
  commands += '\x1B\x45\x01'; // Bold on
  commands += sanitizeText(receiptData?.storeInfo?.storeName || 'Store Name') + '\n';
  // Add branch name if it exists and is not empty
  if (receiptData?.storeInfo?.branchName && sanitizeText(receiptData.storeInfo.branchName) !== '') {
    commands += `Branch: ${sanitizeText(receiptData.storeInfo.branchName)}\n`;
  }
  commands += '\x1B\x45\x00'; // Bold off
  
  // Store details - CENTERED with normal font
  commands += (sanitizeText(receiptData?.storeInfo?.address) || 'Store Address') + '\n';
  commands += `Tel: ${sanitizeText(receiptData?.storeInfo?.phone) || 'N/A'}\n`;
  commands += `Email: ${sanitizeText(receiptData?.storeInfo?.email) || 'N/A'}\n`;
  commands += `TIN: ${sanitizeText(receiptData?.storeInfo?.tin) || 'N/A'}\n`;
  
  // BIR Information
  if (receiptData?.storeInfo?.birPermitNo) {
    commands += `BIR: ${sanitizeText(receiptData.storeInfo.birPermitNo)}\n`;
  }
  if (receiptData?.storeInfo?.inclusiveSerialNumber) {
    commands += `SN: ${sanitizeText(receiptData.storeInfo.inclusiveSerialNumber)}\n`;
  }
  if (receiptData?.storeInfo?.minNumber) {
    commands += `MIN: ${sanitizeText(receiptData.storeInfo.minNumber)}\n`;
  }

  commands += `Invoice #: ${sanitizeText(receiptData?.invoiceNumber) || 'Auto-generated'}\n`;
  
  // Invoice Type (centered, bold, slightly larger)
  commands += '\x1D\x21\x01'; // Double height for invoice type
  commands += '\x1B\x45\x01'; // Bold on
  commands += (sanitizeText(receiptData?.storeInfo?.invoiceType) || 'SALES INVOICE') + '\n';
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
  const customerName = sanitizeText(receiptData?.customerName) || 'Walk-in Customer';
  commands += `SOLD TO: ${customerName}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
    if (receiptData?.customerName && sanitizeText(receiptData.customerName) !== 'Walk-in Customer') {
    if (receiptData?.customerAddress && sanitizeText(receiptData.customerAddress) !== '') {
      commands += `Address: ${sanitizeText(receiptData.customerAddress)}\n`;
    }
    if (receiptData?.customerTin && sanitizeText(receiptData.customerTin) !== '') {
      commands += `TIN: ${sanitizeText(receiptData.customerTin)}\n`;
    }
  }
  
  commands += separatorLine;
  
  // Date and Cashier - BOLD
  commands += '\x1B\x45\x01'; // Bold on
  commands += `Cashier: ${sanitizeText(receiptData?.cashier) || 'N/A'}\n`;
  const date = new Date(receiptData?.receiptDate || new Date());
  commands += `${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
  commands += '\x1B\x45\x00'; // Bold off
  
  commands += separatorLine;
  
  // Items header - BOLD and clearer (adapt to paper width)
  commands += '\x1B\x45\x01'; // Bold on
  const qtyColWidth = 3;
  const amountColWidth = 8;
  const totalColWidth = 8;
  const productColWidth = lineChars - qtyColWidth - amountColWidth - totalColWidth - 3;
  const itemsHeader = 'Product'.padEnd(productColWidth) + ' ' + 'Qty'.padEnd(qtyColWidth) + ' ' + 'Amount'.padEnd(amountColWidth) + ' ' + 'Total'.padStart(totalColWidth);
  commands += itemsHeader + '\n';
  commands += '\x1B\x45\x00'; // Bold off
  commands += separatorLine;
  
  if (receiptData?.items) {
    receiptData.items.forEach((item: any) => {
      const qty = (item.quantity || 1).toString();
      const unitType = item.unitType && item.unitType !== 'N/A' ? ` ${item.unitType.substring(0, 2)}(s)` : ' pc(s)';
      const qtyLabel = sanitizeText(`${qty}${unitType}`);
      const total = (item.total || 0).toFixed(2);
      const unitPrice = (item.sellingPrice || item.price || 0).toFixed(2);
      const productName = sanitizeText(item.productName || item.name || 'Item');
      const wrappedProductLines = wrapText(productName, productColWidth);

      // First product line with quantity, amount, and total
      commands += '\x1B\x45\x01';
      commands += padRight(wrappedProductLines[0], productColWidth) + ' ' + padRight(qtyLabel, qtyColWidth) + ' ' + padRight(`₱${unitPrice}`, amountColWidth) + ' ' + padLeft(`₱${total}`, totalColWidth) + '\n';
      commands += '\x1B\x45\x00';

      for (let i = 1; i < wrappedProductLines.length; i++) {
        commands += padRight(wrappedProductLines[i], productColWidth) + ' ' + ' '.repeat(qtyColWidth) + ' ' + ' '.repeat(amountColWidth) + ' ' + ' '.repeat(totalColWidth) + '\n';
      }

      const skuText = sanitizeText(item.skuId || item.productId || '');
      if (skuText) {
        commands += `    ${skuText}\n`;
      }
      commands += `    @ ${unitPrice} each\n`;
    });
  }
  
  commands += separatorLine;
  
  // Totals - Right aligned with dynamic width and BOLD amounts
  const receiptWidth = lineChars; // Use dynamic width based on paper size
  const vatableSalesAmt = Number(receiptData?.vatableSales || 0).toFixed(2);
  const subtotalAmt = Number(receiptData?.subtotal || 0).toFixed(2);
  const vatAmt = Number(receiptData?.vatAmount || 0).toFixed(2);
  const vatExemptAmt = Number((receiptData?.vatExempt ?? receiptData?.vatExemptAmount) || 0).toFixed(2);
  const discountAmt2 = Number(receiptData?.discount || 0).toFixed(2);

  if (Number(vatableSalesAmt) > 0) {
    commands += '\x1B\x45\x01'; // Bold on
    const subtotalLine = `Vatable Sales: ${vatableSalesAmt}`;
    const subtotalSpaces = ' '.repeat(Math.max(0, receiptWidth - subtotalLine.length));
    commands += `${subtotalSpaces}${subtotalLine}\n`;
    commands += '\x1B\x45\x00'; // Bold off
  } else if (Number(subtotalAmt) > 0) {
    commands += '\x1B\x45\x01'; // Bold on
    const subtotalLine = `Subtotal: ${subtotalAmt}`;
    const subtotalSpaces = ' '.repeat(Math.max(0, receiptWidth - subtotalLine.length));
    commands += `${subtotalSpaces}${subtotalLine}\n`;
    commands += '\x1B\x45\x00'; // Bold off
  }
  if (Number(vatAmt) > 0) {
    commands += '\x1B\x45\x01'; // Bold on
    const vatLine = `VAT Amount: ${vatAmt}`;
    const vatSpaces = ' '.repeat(Math.max(0, receiptWidth - vatLine.length));
    commands += `${vatSpaces}${vatLine}\n`;
    commands += '\x1B\x45\x00'; // Bold off
  }
  if (Number(vatExemptAmt) > 0) {
    commands += '\x1B\x45\x01'; // Bold on
    const vatExemptLine = `VAT Exempt: ${vatExemptAmt}`;
    const vatExemptSpaces = ' '.repeat(Math.max(0, receiptWidth - vatExemptLine.length));
    commands += `${vatExemptSpaces}${vatExemptLine}\n`;
    commands += '\x1B\x45\x00'; // Bold off
  }
  if (Number(discountAmt2) > 0) {
    commands += '\x1B\x45\x01'; // Bold on
    const discountLine = `Discount: ${discountAmt2}`;
    const discountSpaces = ' '.repeat(Math.max(0, receiptWidth - discountLine.length));
    commands += `${discountSpaces}${discountLine}\n`;
    commands += '\x1B\x45\x00'; // Bold off
  }
  
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
    commands += sanitizeText(receiptData.validityNotice) + '\n';
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

export function generateReceiptPreviewText(receiptData: any, paperConfig: PaperSizeConfig): string {
  const lineChars = paperConfig.lineChars;

  const sanitizeText = (input: any) => {
    if (input === null || input === undefined) return '';
    let s = String(input);
    s = s.replace(/\u2018|\u2019|\u201A|\u201B/g, "'")
         .replace(/\u201C|\u201D|\u201E/g, '"')
         .replace(/\u2013|\u2014/g, '-')
         .replace(/\u2026/g, '...')
         .replace(/\u02C6/g, '^');
    try { s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    s = s.replace(/[^\x00-\x7F]/g, '');
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    return s.trim();
  };

  const wrapText = (text: string, width: number): string[] => {
    const sanitized = sanitizeText(text);
    if (!sanitized) return [''];
    const words = sanitized.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      if (word.length > width) {
        if (current) {
          lines.push(current);
          current = '';
        }
        let idx = 0;
        while (idx < word.length) {
          lines.push(word.substring(idx, idx + width));
          idx += width;
        }
        continue;
      }
      if (!current) {
        current = word;
      } else if ((current.length + 1 + word.length) <= width) {
        current += ' ' + word;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const centerLine = (text: string) => {
    const sanitized = sanitizeText(text);
    if (!sanitized) return '';
    if (sanitized.length >= lineChars) return sanitized;
    const padding = Math.ceil((lineChars - sanitized.length) / 2);
    return ' '.repeat(padding) + sanitized;
  };

  const padRight = (text: string, width: number) => {
    const sanitized = sanitizeText(text);
    return sanitized.length >= width ? sanitized.substring(0, width) : sanitized + ' '.repeat(width - sanitized.length);
  };

  const padLeft = (text: string, width: number) => {
    const sanitized = sanitizeText(text);
    return sanitized.length >= width ? sanitized.substring(0, width) : ' '.repeat(width - sanitized.length) + sanitized;
  };

  const separatorLine = '-'.repeat(lineChars);
  const doubleSeparatorLine = '='.repeat(lineChars);

  const storeName = sanitizeText(receiptData?.storeInfo?.storeName || 'Store Name');
  const branch = sanitizeText(receiptData?.storeInfo?.branchName || '');
  const address = sanitizeText(receiptData?.storeInfo?.address || '');
  const phone = sanitizeText(receiptData?.storeInfo?.phone || 'N/A');
  const email = sanitizeText(receiptData?.storeInfo?.email || 'N/A');
  const invoiceNumber = sanitizeText(receiptData?.invoiceNumber || 'Auto-generated');
  const invoiceType = sanitizeText(receiptData?.storeInfo?.invoiceType || 'Sales Invoice');
  const cashier = sanitizeText(receiptData?.cashier || 'N/A');
  const dateString = `${new Date(receiptData?.receiptDate || new Date()).toLocaleDateString()} ${new Date(receiptData?.receiptDate || new Date()).toLocaleTimeString()}`;
  const customerName = sanitizeText(receiptData?.customerName && receiptData.customerName !== 'N/A' ? receiptData.customerName : 'Walk-in Customer');

  const isCashSale = receiptData?.isCashSale !== false;
  const paymentMethod = isCashSale ? 'Cash' : (receiptData?.isChargeSale ? 'Charge' : 'N/A');

  let output = '';

  output += centerLine(storeName) + '\n';
  if (branch) output += centerLine(`Branch: ${branch}`) + '\n';

  if (address) {
    wrapText(address, lineChars).forEach(line => {
      output += centerLine(line) + '\n';
    });
  }

  const contactLine = `Tel: ${phone}${email ? ' | Email: ' + email : ''}`;
  wrapText(contactLine, lineChars).forEach(line => {
    output += centerLine(line) + '\n';
  });
  // add one blank line after contact/email to separate from invoice
  output += '\n';

  output += centerLine(`Invoice #: ${invoiceNumber}`) + '\n';

  output += centerLine(invoiceType) + '\n';
  // ensure one blank line between invoice type and payment
  output += '\n';

  output += `Payment: ${paymentMethod}` + '\n';

  output += `SOLD TO: ${customerName}` + '\n';

  output += `Cashier: ${cashier}` + '\n';
  output += `Date: ${dateString}` + '\n';

  const qtyColWidth = 3;
  const amountColWidth = 8;
  const totalColWidth = 8;
  const productColWidth = lineChars - qtyColWidth - amountColWidth - totalColWidth - 3;

  const headerQty = padLeft('Qty', qtyColWidth);
  const headerAmount = padLeft('Amount', amountColWidth);
  const headerTotal = padLeft('Total', totalColWidth);

  output += padRight('Product', productColWidth) + ' ' + headerQty + ' ' + headerAmount + ' ' + headerTotal + '\n';
  output += separatorLine + '\n';

  if (Array.isArray(receiptData?.items)) {
    receiptData.items.forEach((item: any) => {
      const qty = String(item.quantity || 1);
      const qtyLabel = qty;
      const productName = sanitizeText(item.productName || item.name || 'Item');
      const truncatedProduct = productName.length > productColWidth ? productName.substring(0, productColWidth) : productName;
      const unitPrice = `₱${Number(item.sellingPrice || item.price || 0).toFixed(2)}`;
      const total = `₱${Number(item.total || 0).toFixed(2)}`;

      output += padRight(truncatedProduct, productColWidth) + ' ' + padLeft(qtyLabel, qtyColWidth) + ' ' + padLeft(unitPrice, amountColWidth) + ' ' + padLeft(total, totalColWidth) + '\n';
      const skuText = sanitizeText(item.skuId || item.productId || '');
      if (skuText) {
        output += `  ${skuText}\n`;
      }
      output += `    @ ${Number(item.sellingPrice || item.price || 0).toFixed(2)} each\n`;
    });
  }

  output += separatorLine + '\n';

  const vatableSalesAmt = Number(receiptData?.vatableSales || 0).toFixed(2);
  const subtotalAmt = Number(receiptData?.subtotal || 0).toFixed(2);
  const vatAmt = Number(receiptData?.vatAmount || 0).toFixed(2);
  const vatExemptAmt = Number((receiptData?.vatExempt ?? receiptData?.vatExemptAmount) || 0).toFixed(2);
  const discountAmt = Number(receiptData?.discount || 0).toFixed(2);
  const totalAmt = Number(receiptData?.totalAmount || receiptData?.netAmount || 0).toFixed(2);

  if (Number(vatableSalesAmt) > 0) {
    output += padLeft(`Vatable Sales: ${vatableSalesAmt}`, lineChars) + '\n';
  } else if (Number(subtotalAmt) > 0) {
    output += padLeft(`Subtotal: ${subtotalAmt}`, lineChars) + '\n';
  }
  if (Number(vatAmt) > 0) {
    output += padLeft(`VAT Amount: ${vatAmt}`, lineChars) + '\n';
  }
  if (Number(vatExemptAmt) > 0) {
    output += padLeft(`VAT Exempt: ${vatExemptAmt}`, lineChars) + '\n';
  }
  if (Number(discountAmt) > 0) {
    output += padLeft(`Discount: ${discountAmt}`, lineChars) + '\n';
  }

  output += doubleSeparatorLine + '\n';
  output += padLeft(`Net Amount: ${totalAmt}`, lineChars) + '\n';
  output += doubleSeparatorLine + '\n';
  output += '\n';

  output += centerLine('Thank you for your purchase!') + '\n';
  output += centerLine('Please come again.') + '\n';
  output += '\n';
  output += centerLine('This receipt serves as a sales acknowledgment receipt. This document is not valid for claim of input tax.') + '\n';

  return output;
}

export function encodeEscposStringToBytes(input: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code <= 0x7F) {
      bytes.push(code);
      continue;
    }
    let normalized = char;
    try {
      normalized = char.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    } catch (e) {
      normalized = char;
    }
    for (const normalizedChar of normalized) {
      const normalizedCode = normalizedChar.charCodeAt(0);
      bytes.push(normalizedCode <= 0x7F ? normalizedCode : 0x3F);
    }
  }
  return new Uint8Array(bytes);
}


import { Injectable } from '@angular/core';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { generateESCPOSCommands, encodeEscposStringToBytes } from './escpos-utils';

export interface PaperSizeConfig {
  width: string;
  maxWidth: string;
  receiptWidth: number;
  fontSize: string;
  lineChars: number;
}

@Injectable({
  providedIn: 'root'
})
export class ThermalPrinterService {
  private connectedDevice: BleDevice | null = null;
  private writeCharacteristic: string | null = null;
  private serviceUuid: string | null = null;
  private isInitialized = false;

  // ESC/POS Commands
  private readonly ESC = 0x1B;
  private readonly GS = 0x1D;

  constructor() {
    console.log('≡ƒû¿∩╕Å Thermal Printer Service initialized');
  }

  /**
   * Initialize BLE and request permissions
   */
  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('ΓÜá∩╕Å Not on native platform, thermal printing not available');
      return false;
    }

    try {
      await BleClient.initialize();
      this.isInitialized = true;
      console.log('Γ£à BLE initialized');
      return true;
    } catch (error) {
      console.error('Γ¥î BLE initialization failed:', error);
      return false;
    }
  }

  /**
   * Scan and connect to a Bluetooth thermal printer
   */
  async connectToPrinter(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Bluetooth LE');
        }
      }

      // Check if Bluetooth is enabled
      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        throw new Error('Please enable Bluetooth and try again');
      }

      console.log('≡ƒöì Scanning for printers...');
      
      // Request device from user
      const device = await BleClient.requestDevice({
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // Common printer service
      });

      console.log('≡ƒö╡ Connecting to:', device.name || device.deviceId);

      // Connect to device
      await BleClient.connect(device.deviceId, (deviceId) => {
        console.log('ΓÜá∩╕Å Device disconnected:', deviceId);
        if (this.connectedDevice?.deviceId === deviceId) {
          this.connectedDevice = null;
          this.writeCharacteristic = null;
          this.serviceUuid = null;
        }
      });

      // Discover services and characteristics
      const services = await BleClient.getServices(device.deviceId);
      console.log(`≡ƒôï Found ${services.length} services`);

      // Find writable characteristic
      for (const service of services) {
        for (const char of service.characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.serviceUuid = service.uuid;
            this.writeCharacteristic = char.uuid;
            break;
          }
        }
        if (this.writeCharacteristic) break;
      }

      if (!this.writeCharacteristic || !this.serviceUuid) {
        throw new Error('Could not find printer write characteristic');
      }

      this.connectedDevice = device;
      console.log('Γ£à Connected to printer successfully');
      return true;

    } catch (error: any) {
      console.error('Γ¥î Connection failed:', error);
      
      let errorMsg = `Connection Error:\n${error.message || error}`;
      
      if (error.message?.includes('User cancelled')) {
        errorMsg = 'You cancelled device selection.\n\nPlease select your Bluetooth printer to continue.';
      } else if (error.message?.includes('Bluetooth')) {
        errorMsg = `Bluetooth Error:\n${error.message}`;
      } else {
        errorMsg = `Connection failed:\n${error.message || error}\n\nMake sure:\nΓÇó Printer is turned ON\nΓÇó Printer is nearby\nΓÇó Bluetooth is enabled`;
      }
      
      throw new Error(errorMsg);
    }
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.connectedDevice !== null && this.writeCharacteristic !== null;
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await BleClient.disconnect(this.connectedDevice.deviceId);
        console.log('Γ£à Disconnected from printer');
      } catch (error) {
        console.error('Γ¥î Disconnect error:', error);
      }
      this.connectedDevice = null;
      this.writeCharacteristic = null;
      this.serviceUuid = null;
    }
  }

  /**
   * Print receipt data
   */
  async printReceipt(receiptData: any): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected. Please connect to your printer first.');
    }

    try {
      const escposData = this.generateESCPOS(receiptData);
      console.log('≡ƒôñ ESC/POS data length:', escposData.length, 'bytes');
      
      await this.sendToPrinter(escposData);
      
      console.log('Γ£à Receipt printed successfully');
      
    } catch (error: any) {
      console.error('Γ¥î Print failed:', error);
      const errorMsg = `Print Error:\n${error.message || error}\n\nStack: ${error.stack || 'No stack'}`;
      throw new Error('Printing failed. Please check printer connection.');
    }
  }

  /**
   * Send raw data to printer
   */
  private async sendToPrinter(data: Uint8Array): Promise<void> {
    if (!this.connectedDevice || !this.serviceUuid || !this.writeCharacteristic) {
      throw new Error('Printer not connected');
    }

    console.log('≡ƒôñ Sending data to printer...');
    console.log(`≡ƒôè Total bytes: ${data.length}`);


    try {
      // Some printers work better with smaller chunks
      const chunkSize = 20; // Very small chunks for compatibility
      let totalSent = 0;

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
        const dataView = new DataView(chunk.buffer);
        

        try {
          await BleClient.write(
            this.connectedDevice.deviceId,
            this.serviceUuid,
            this.writeCharacteristic,
            dataView
          );
          
          totalSent += chunk.length;
        } catch (chunkError: any) {
          const errorMsg = `Chunk ${Math.floor(i / chunkSize) + 1} failed:\n${chunkError.message || chunkError}`;
          console.error(errorMsg);
          throw chunkError;
        }
        
        // Longer delay to ensure printer processes each chunk
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Γ£à Successfully sent ${totalSent} bytes to printer`);
      
      // Wait for printer to finish
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error('Γ¥î Send error:', error);

      throw error;
    }
  }

  /**
   * Map paper size to shared ESC/POS width config
   */
  private getPaperSizeConfig(paperSize: string = '58mm'): PaperSizeConfig {
    const configs: Record<string, PaperSizeConfig> = {
      '58mm': { width: '58mm', maxWidth: '210px', receiptWidth: 32, fontSize: '11px', lineChars: 32 },
      '80mm': { width: '80mm', maxWidth: '300px', receiptWidth: 48, fontSize: '12px', lineChars: 48 },
      '127mm': { width: '127mm', maxWidth: '480px', receiptWidth: 64, fontSize: '13px', lineChars: 64 }
    };
    return configs[paperSize] || configs['58mm'];
  }

  /**
   * Generate ESC/POS commands for receipt
   */
  private generateESCPOS(receiptData: any): Uint8Array {
    const paperSize = receiptData?._paperSize || '58mm';
    const paperConfig = this.getPaperSizeConfig(paperSize);
    const escposCommands = generateESCPOSCommands(receiptData, paperConfig);
    const result = encodeEscposStringToBytes(escposCommands);
    console.log(`Γ£à Generated ${result.length} bytes of shared ESC/POS data`);
    return result;
  }

  /**
   * Get connected printer info
   */
  getConnectedPrinter(): string | null {
    return this.connectedDevice ? (this.connectedDevice.name || this.connectedDevice.deviceId) : null;
  }

  /**
   * Print a test receipt to verify printer functionality
   */
  async printTestReceipt(): Promise<void> {
    const testData = {
      storeName: 'TEST STORE',
      storeAddress: '123 Test Street',
      storeContact: 'Tel: 123-456-7890',
      invoiceNumber: 'TEST-001',
      date: new Date().toLocaleString(),
      cashier: 'Test User',
      items: [
        { name: 'Test Item 1', quantity: 2, price: 10.00, total: 20.00 },
        { name: 'Test Item 2', quantity: 1, price: 15.50, total: 15.50 },
        { name: 'Test Item 3', quantity: 3, price: 5.00, total: 15.00 }
      ],
      subtotal: 50.50,
      discount: 5.00,
      tax: 4.55,
      total: 50.05,
      paymentMethod: 'Cash',
      amountPaid: 60.00,
      change: 9.95
    };

    console.log('≡ƒº¬ Printing test receipt...');
    await this.printReceipt(testData);
  }
}

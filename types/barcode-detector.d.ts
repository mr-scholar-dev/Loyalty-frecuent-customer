/**
 * Minimal ambient types for the native BarcodeDetector API (§7 stack),
 * which is not yet in TypeScript's DOM lib. Used with a runtime feature check;
 * `@zxing/browser` is the fallback when unavailable.
 */

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}

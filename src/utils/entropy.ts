/**
 * StegoVault Biomechanical Entropy Harvester.
 * Dual-Source Hybrid Entropy combining physical pointer movement with WebCrypto CSPRNG.
 */

import { generateSalt, generateIV } from './crypto.ts';

export interface EntropyState {
  samplesCount: number;
  maxSamples: number;
  percentage: number;
  isComplete: boolean;
  collectedBits: number;
}

export class EntropyPool {
  private pool: number[] = [];
  private lastX = 0;
  private lastY = 0;
  private lastTime = 0;
  private readonly targetSamples = 128;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.pool = [];
    this.lastX = 0;
    this.lastY = 0;
    this.lastTime = performance.now();
  }

  public addSample(x: number, y: number): EntropyState {
    const now = performance.now();
    const dt = now - this.lastTime;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < 9 || dt <= 0) {
      return this.getState();
    }

    const velocity = Math.min(255, Math.floor((Math.sqrt(distanceSq) / dt) * 10));
    const timeLow = Math.floor(now * 1000) & 0xff;
    const xLow = x & 0xff;
    const yLow = y & 0xff;

    this.pool.push(xLow, yLow, timeLow, velocity);

    this.lastX = x;
    this.lastY = y;
    this.lastTime = now;

    return this.getState();
  }

  public getState(): EntropyState {
    const samplesCount = Math.floor(this.pool.length / 4);
    const percentage = Math.min(100, Math.floor((samplesCount / this.targetSamples) * 100));
    const collectedBits = Math.min(256, Math.floor((percentage / 100) * 256));

    return {
      samplesCount,
      maxSamples: this.targetSamples,
      percentage,
      isComplete: percentage >= 100,
      collectedBits,
    };
  }

  public async generateHybridSaltAndIV(): Promise<{ salt: Uint8Array; iv: Uint8Array }> {
    const hwSalt = generateSalt();
    const hwIV = generateIV();

    if (this.pool.length === 0) {
      return { salt: hwSalt, iv: hwIV };
    }

    const rawBytes = new Uint8Array(this.pool);
    const hashBuffer = await crypto.subtle.digest('SHA-256', rawBytes.buffer as ArrayBuffer);
    const humanBytes = new Uint8Array(hashBuffer);

    const hybridSalt = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      hybridSalt[i] = hwSalt[i] ^ humanBytes[i];
    }

    const hybridIV = new Uint8Array(12);
    for (let i = 0; i < 12; i++) {
      hybridIV[i] = hwIV[i] ^ humanBytes[16 + i];
    }

    return { salt: hybridSalt, iv: hybridIV };
  }
}

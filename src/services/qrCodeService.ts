import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { TimeService } from './timeService';

export interface DailyQRCode {
  code: string;
  createdAt: any;
  expiresAt: any;
  date: string;
}

class QRCodeService {
  private static instance: QRCodeService;
  private timeService: TimeService;

  private constructor() {
    this.timeService = TimeService.getInstance();
  }

  public static getInstance(): QRCodeService {
    if (!QRCodeService.instance) {
      QRCodeService.instance = new QRCodeService();
    }
    return QRCodeService.instance;
  }

  async generateDailyCode(): Promise<string> {
    const today = this.timeService.getCurrentDateString();
    const result = await convex.mutation(api.qrCodes.getOrCreate as any, { today }) as any;
    return result.code;
  }

  async ensureTodayCode(canWrite: boolean): Promise<DailyQRCode | null> {
    const today = this.timeService.getCurrentDateString();
    const existing = await convex.query(api.qrCodes.getCurrent as any, { today }) as any;

    if (existing) return existing;

    if (!canWrite) return null;

    try {
      const result = await this.generateDailyCode();
      return { code: result, date: today, createdAt: Date.now(), expiresAt: null };
    } catch (err: unknown) {
      throw err;
    }
  }

  async getDailyCode(): Promise<DailyQRCode | null> {
    const today = this.timeService.getCurrentDateString();
    const result = await convex.query(api.qrCodes.getCurrent as any, { today }) as any;
    return result || null;
  }

  subscribeToDailyCode(callback: (qrCode: DailyQRCode | null) => void) {
    const today = this.timeService.getCurrentDateString();
    const watch = convex.watchQuery(
      api.qrCodes.getCurrent as any,
      { today },
    );
    const unsub = watch.onUpdate(() => {
      const val = watch.localQueryResult() as any;
      if (val && val.date === today) callback(val);
      else callback(null);
    });
    return unsub;
  }

  async validateCode(code: string): Promise<boolean> {
    const today = this.timeService.getCurrentDateString();
    return await convex.query(api.qrCodes.validate as any, { code, today });
  }
}

export const qrCodeService = QRCodeService.getInstance();

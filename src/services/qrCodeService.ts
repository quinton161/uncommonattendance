import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
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

  private generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateDailyCode(): Promise<string> {
    const today = this.timeService.getCurrentDateString();
    const newCode = this.generateRandomCode();
    
    // Set expiration to end of the day (23:59:59)
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const qrData: DailyQRCode = {
      code: newCode,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      date: today
    };

    await setDoc(doc(db, 'system_config', 'daily_qr_code'), qrData);
    return newCode;
  }

  async getDailyCode(): Promise<DailyQRCode | null> {
    const docRef = doc(db, 'system_config', 'daily_qr_code');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DailyQRCode;
      const today = this.timeService.getCurrentDateString();
      
      // Only return if it's for today
      if (data.date === today) {
        return data;
      }
    }
    return null;
  }

  subscribeToDailyCode(callback: (qrCode: DailyQRCode | null) => void) {
    return onSnapshot(doc(db, 'system_config', 'daily_qr_code'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyQRCode;
        const today = this.timeService.getCurrentDateString();
        if (data.date === today) {
          callback(data);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  async validateCode(code: string): Promise<boolean> {
    const currentCode = await this.getDailyCode();
    if (!currentCode) return false;
    
    return currentCode.code.toUpperCase() === code.toUpperCase();
  }
}

export const qrCodeService = QRCodeService.getInstance();

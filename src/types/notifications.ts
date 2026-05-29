export type NotificationType = 'check_in' | 'check_out' | 'late' | 'award' | 'announcement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  hubId?: string;
  hubName?: string;
  studentId?: string;
  studentName?: string;
  createdAt: Date;
  readBy: string[];
}

export interface MonthlyAwardWinner {
  rank: number;
  studentId: string;
  studentName: string;
  attendanceRate: number;
  present: number;
  late: number;
  streak?: number;
}

export interface MonthlyAwardDoc {
  period: string;
  hubId: string;
  hubName: string;
  winners: MonthlyAwardWinner[];
  computedAt: Date;
}

export interface HubMonthlyRankingRow {
  hubId: string;
  hubName: string;
  enrolled: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
  rank: number;
}

export interface StudentLeaderboardRow {
  rank: number;
  studentId: string;
  studentName: string;
  email?: string;
  photoUrl?: string;
  hubId?: string;
  hubName?: string;
  attendanceRate: number;
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  streak: number;
}

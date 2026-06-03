export type CheckoutMethod = 'student' | 'staff';

export function isStudentSelfCheckout(record: {
  checkOutTime?: Date | null;
  checkOutMethod?: string | null;
}): boolean {
  if (!record.checkOutTime) return false;
  const t = record.checkOutTime instanceof Date ? record.checkOutTime : null;
  if (!t || Number.isNaN(t.getTime())) return false;
  return record.checkOutMethod === 'student';
}

export function isStaffCheckout(record: {
  checkOutTime?: Date | null;
  checkOutMethod?: string | null;
}): boolean {
  if (!record.checkOutTime) return false;
  const t = record.checkOutTime instanceof Date ? record.checkOutTime : null;
  if (!t || Number.isNaN(t.getTime())) return false;
  return record.checkOutMethod === 'staff';
}

/** Student or staff recorded check-out (not legacy phantom rows without a method). */
export function hasRecordedCheckout(record: {
  checkOutTime?: Date | null;
  checkOutMethod?: string | null;
}): boolean {
  return isStudentSelfCheckout(record) || isStaffCheckout(record);
}

/** True when the student tapped Check Out (not staff bulk close or legacy phantom rows). */
export function isStudentSelfCheckout(record: {
  checkOutTime?: Date | null;
  checkOutMethod?: string | null;
}): boolean {
  if (!record.checkOutTime) return false;
  const t = record.checkOutTime instanceof Date ? record.checkOutTime : null;
  if (!t || Number.isNaN(t.getTime())) return false;
  return record.checkOutMethod === 'student';
}

export function hasStaffSessionClosed(record: {
  staffSessionClosedAt?: Date | null;
}): boolean {
  const t = record.staffSessionClosedAt;
  if (!t || !(t instanceof Date) || Number.isNaN(t.getTime())) return false;
  return true;
}

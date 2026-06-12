export const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString();
};

export const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const now = (): Date => new Date();

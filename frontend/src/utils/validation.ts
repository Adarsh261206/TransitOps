export interface FieldError {
  field: string;
  message: string;
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') return `${fieldName} is required`;
  return null;
}

export function validateNumber(value: any, fieldName: string, min?: number, max?: number): string | null {
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (min !== undefined && num < min) return `${fieldName} must be at least ${min}`;
  if (max !== undefined && num > max) return `${fieldName} must be at most ${max}`;
  return null;
}

export function validateDateString(value: string, fieldName: string): string | null {
  if (!value || value === '') return null; // optional
  const d = new Date(value);
  if (isNaN(d.getTime())) return `${fieldName} is not a valid date`;
  return null;
}

export function getFieldError(errors: FieldError[], field: string): string | undefined {
  return errors.find(e => e.field === field)?.message;
}

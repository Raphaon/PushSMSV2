// Normalize to E.164 format, keep leading + if present
export const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) return digits;
  // If starts with 00, replace with +
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  return digits;
};

export const isValidPhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  // E.164: + followed by 7-15 digits
  return /^\+?[1-9]\d{6,14}$/.test(normalized);
};

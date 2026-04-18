const GSM7_CHARS =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

const GSM7_EXT = '{}\\[~]|€';

const isGsm7 = (char) => GSM7_CHARS.includes(char) || GSM7_EXT.includes(char);
const isGsm7Extended = (char) => GSM7_EXT.includes(char);

export const getEncoding = (text) => {
  for (const char of text) {
    if (!isGsm7(char)) return 'UCS2';
  }
  return 'GSM7';
};

export const getCharCount = (text) => {
  let count = 0;
  for (const char of text) {
    count += isGsm7Extended(char) ? 2 : 1;
  }
  return count;
};

export const calculateParts = (text) => {
  if (!text) return 1;
  const encoding = getEncoding(text);
  const charCount = encoding === 'GSM7' ? getCharCount(text) : text.length;
  const singleLimit = encoding === 'GSM7' ? 160 : 70;
  const multiLimit = encoding === 'GSM7' ? 153 : 67;

  if (charCount <= singleLimit) return 1;
  return Math.ceil(charCount / multiLimit);
};

export const injectVariables = (template, variables = {}) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
};

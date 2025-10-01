const BUSINESS_NUMBER_LENGTH = 10;

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

export const normalizeBusinessNumber = (value: string) => digitsOnly(value);

export const isValidBusinessNumber = (value: string) =>
  digitsOnly(value).length === BUSINESS_NUMBER_LENGTH;

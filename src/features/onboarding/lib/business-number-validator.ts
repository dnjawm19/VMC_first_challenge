const BUSINESS_NUMBER_LENGTH = 10;

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

const checksumWeights = [1, 3, 7, 1, 3, 7, 1, 3, 5];

const calculateChecksum = (numbers: number[]) => {
  const sum = numbers
    .slice(0, BUSINESS_NUMBER_LENGTH - 1)
    .reduce((acc, num, index) => {
      if (index === checksumWeights.length - 1) {
        return acc + Math.floor((num * checksumWeights[index]) / 10) + (num * checksumWeights[index]);
      }

      return acc + num * checksumWeights[index];
    }, 0);

  return (10 - (sum % 10)) % 10;
};

export const normalizeBusinessNumber = (value: string) => digitsOnly(value);

export const isValidBusinessNumber = (value: string) => {
  const normalized = digitsOnly(value);

  if (normalized.length !== BUSINESS_NUMBER_LENGTH) {
    return false;
  }

  const digits = normalized.split('').map((char) => Number.parseInt(char, 10));

  if (digits.some(Number.isNaN)) {
    return false;
  }

  const checksum = calculateChecksum(digits);

  return checksum === digits[BUSINESS_NUMBER_LENGTH - 1];
};

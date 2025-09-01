import { normalizeSuiAddress as suiNormalize } from '@mysten/sui.js/utils';

export function normalizeSuiAddress(address: string): string {
  try {
    return suiNormalize(address);
  } catch (error) {
    throw new Error(`Invalid Sui address: ${address}`);
  }
}

export function validateSuiAddress(address: string): boolean {
  try {
    normalizeSuiAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function shortenAddress(address: string, length: number = 8): string {
  if (!address) return '';
  const normalized = normalizeSuiAddress(address);
  return `${normalized.slice(0, length)}...${normalized.slice(-length)}`;
}

export function isZeroAddress(address: string): boolean {
  const normalized = normalizeSuiAddress(address);
  return normalized === '0x0000000000000000000000000000000000000000000000000000000000000000';
}

export function compareAddresses(address1: string, address2: string): boolean {
  try {
    const norm1 = normalizeSuiAddress(address1);
    const norm2 = normalizeSuiAddress(address2);
    return norm1 === norm2;
  } catch {
    return false;
  }
}

export function extractPackageIdFromAddress(address: string): string {
  const normalized = normalizeSuiAddress(address);
  // Extract package ID from object address (first 64 characters)
  return normalized.slice(0, 66); // Include '0x'
}

export function isPackageAddress(address: string): boolean {
  try {
    const normalized = normalizeSuiAddress(address);
    // Package addresses typically have specific patterns
    // This is a simplified check - you might want to add more specific validation
    return normalized.length === 66 && normalized.startsWith('0x');
  } catch {
    return false;
  }
}

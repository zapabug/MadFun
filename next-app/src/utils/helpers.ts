/**
 * Format a Nostr public key for display
 * @param pubkey The public key to format
 * @param length The number of characters to show at each end
 */
export function formatPubkey(pubkey: string, length: number = 4): string {
  if (!pubkey) return '';
  if (pubkey.startsWith('npub1')) {
    return pubkey.length > length * 2 + 5 
      ? `${pubkey.substring(0, length + 5)}...${pubkey.substring(pubkey.length - length)}`
      : pubkey;
  }
  
  return pubkey.length > length * 2
    ? `${pubkey.substring(0, length)}...${pubkey.substring(pubkey.length - length)}`
    : pubkey;
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateInput: Date | number): string {
  const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const timeUnits: [string, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ];
  
  for (const [unit, seconds] of timeUnits) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
}

/**
 * Get lightning payment info from NIP-05 or LUD16
 * @param profile The profile to extract lightning info from
 */
export function getLightningInfo(profile: {lud16?: string, nip05?: string}): {address: string, lightning: string} | null {
  if (!profile) return null;
  
  // First try LUD16
  if (profile.lud16) {
    return {
      address: profile.lud16,
      lightning: `lightning:${profile.lud16}`
    };
  }
  
  // Then try NIP-05 (name@domain.com)
  if (profile.nip05 && profile.nip05.includes('@')) {
    const [name, domain] = profile.nip05.split('@');
    if (name && domain) {
      return {
        address: profile.nip05,
        lightning: `lightning:${name}@${domain}`
      };
    }
  }
  
  return null;
}

/**
 * Convert hex color to RGBA
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex || typeof hex !== 'string') return 'rgba(0, 0, 0, 1)';
  
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate a random hex color
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Parse URLs from text
 */
export function parseUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Convert a Unix timestamp to a Date object
 */
export function unixTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Check if a string is a valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Wait for a specified amount of time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
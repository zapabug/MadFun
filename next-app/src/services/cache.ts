import { NostrProfile, Contact, WotConnection, CacheStats } from '@/types/nostr';

/**
 * Cache service for storing Nostr data
 * Implements caching for profiles, contacts, and web of trust connections
 */
class CacheService {
  private profiles: Map<string, NostrProfile> = new Map();
  private contacts: Map<string, Contact[]> = new Map();
  private lastUpdated: Date | null = null;

  // Profile cache methods
  
  /**
   * Store a profile in the cache
   * @param profile Profile to store
   */
  storeProfile(profile: NostrProfile): void {
    if (!profile.pubkey) return;
    this.profiles.set(profile.pubkey, profile);
    this.lastUpdated = new Date();
  }

  /**
   * Get a profile from the cache
   * @param pubkey Public key to retrieve
   */
  getProfile(pubkey: string): NostrProfile | null {
    return this.profiles.get(pubkey) || null;
  }

  /**
   * Store multiple profiles in the cache
   * @param profiles Array of profiles to store
   */
  storeProfiles(profiles: NostrProfile[]): void {
    for (const profile of profiles) {
      this.storeProfile(profile);
    }
    this.lastUpdated = new Date();
  }

  /**
   * Get all profiles from the cache
   */
  getAllProfiles(): NostrProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Check if a profile exists in the cache
   * @param pubkey Public key to check
   */
  hasProfile(pubkey: string): boolean {
    return this.profiles.has(pubkey);
  }

  /**
   * Get count of cached profiles
   */
  getProfileCount(): number {
    return this.profiles.size;
  }

  // Contact cache methods
  
  /**
   * Store contacts for a user
   * @param pubkey User's public key
   * @param contacts Array of contacts
   */
  storeContacts(pubkey: string, contacts: Contact[]): void {
    this.contacts.set(pubkey, contacts);
    this.lastUpdated = new Date();
  }

  /**
   * Get contacts for a user
   * @param pubkey User's public key
   */
  getContacts(pubkey: string): Contact[] {
    return this.contacts.get(pubkey) || [];
  }

  /**
   * Check if we have contacts for a user
   * @param pubkey User's public key
   */
  hasContacts(pubkey: string): boolean {
    return this.contacts.has(pubkey);
  }

  /**
   * Get count of users with cached contacts
   */
  getContactsCount(): number {
    return this.contacts.size;
  }

  // Web of Trust methods
  
  /**
   * Check if two users have a mutual connection
   * @param pubkey1 First user's public key
   * @param pubkey2 Second user's public key
   */
  areMutuallyConnected(pubkey1: string, pubkey2: string): boolean {
    const contacts1 = this.getContacts(pubkey1);
    const contacts2 = this.getContacts(pubkey2);
    
    const isConnected1To2 = contacts1.some(contact => contact.pubkey === pubkey2);
    const isConnected2To1 = contacts2.some(contact => contact.pubkey === pubkey1);
    
    return isConnected1To2 && isConnected2To1;
  }

  /**
   * Get connections for a user with metadata
   * @param pubkey User's public key
   * @param includeMutual Include only mutual connections
   * @param includeVerified Include only verified connections (has NIP-05)
   */
  getUserConnections(
    pubkey: string,
    includeMutual: boolean = false,
    includeVerified: boolean = false
  ): WotConnection[] {
    const contacts = this.getContacts(pubkey);
    const connections: WotConnection[] = [];
    
    for (const contact of contacts) {
      const profile = this.getProfile(contact.pubkey);
      const isMutual = this.areMutuallyConnected(pubkey, contact.pubkey);
      const isVerified = !!profile?.nip05;
      
      // Apply filters if specified
      if ((includeMutual && !isMutual) || (includeVerified && !isVerified)) {
        continue;
      }
      
      connections.push({
        pubkey: contact.pubkey,
        profile,
        isMutual,
        isVerified
      });
    }
    
    // Sort connections: verified first, then mutual
    return connections.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      if (a.isMutual && !b.isMutual) return -1;
      if (!a.isMutual && b.isMutual) return 1;
      return 0;
    });
  }

  /**
   * Get mutual connections between two users
   * @param pubkey1 First user's public key
   * @param pubkey2 Second user's public key
   */
  getMutualConnections(pubkey1: string, pubkey2: string): string[] {
    const contacts1 = this.getContacts(pubkey1).map(c => c.pubkey);
    const contacts2 = this.getContacts(pubkey2).map(c => c.pubkey);
    
    return contacts1.filter(pubkey => contacts2.includes(pubkey));
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      profiles: this.profiles.size,
      contacts: this.contacts.size,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.profiles.clear();
    this.contacts.clear();
    this.lastUpdated = new Date();
  }
}

// Export as singleton
export const cacheService = new CacheService();
export default cacheService;
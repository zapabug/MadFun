import { NDKEvent, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';

/**
 * Interface for user profile data from Nostr
 */
export interface NostrProfile {
  pubkey: string;
  displayName?: string;
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
}

/**
 * Interface for a Nostr event with metadata
 */
export interface EnhancedNostrEvent extends NDKEvent {
  profileData?: NostrProfile;
}

/**
 * Interface for trip-related data
 */
export interface TripData {
  id: string;
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  tags: string[];
  pubkey: string;
  createdAt: number;
}

/**
 * Custom Nostr kinds for our application
 */
export enum MadTripsKind {
  TRIP = 30078, // Base for all trip-related events
  TRIP_ITINERARY = 30079, // Trip itinerary
  TRIP_PHOTOS = 30080, // Trip photos
  TRIP_REVIEW = 30081, // Trip reviews
}

/**
 * Interface for application settings
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  relays: string[];
  defaultZapAmount?: number;
}

/**
 * Nostr kinds for standard events
 */
export enum NostrKind {
  METADATA = 0,      // Profile metadata
  TEXT_NOTE = 1,     // Text note
  RECOMMEND_RELAY = 2, // Recommend relay
  CONTACTS = 3,      // Contacts list
  DM = 4,            // Direct message
}

/**
 * Interface for a contact from Kind 3 event
 */
export interface Contact {
  pubkey: string;
  relay?: string;
  petname?: string;
}

/**
 * Interface for Web of Trust connection with metadata
 */
export interface WotConnection {
  pubkey: string;
  profile: NostrProfile | null;
  isMutual: boolean;
  isVerified: boolean;
}

/**
 * Interface for cache statistics
 */
export interface CacheStats {
  profiles: number;
  contacts: number;
  lastUpdated: Date | null;
}

/**
 * Interface for Nostr service status
 */
export interface NostrStatus {
  connected: boolean;
  connecting: boolean;
  relays: string[];
  error: Error | null;
}

/**
 * Interface for Web of Trust data
 */
export interface WebOfTrustData {
  connections: WotConnection[];
  mutualCount: number;
  verifiedCount: number;
  totalCount: number;
  stats: CacheStats;
}
import NDK, { NDKEvent, NDKFilter, NDKNip07Signer, NDKPrivateKeySigner, NDKSigner, NDKSubscription, NDKUser } from '@nostr-dev-kit/ndk';
import { Contact, MadTripsKind, NostrKind, NostrProfile, NostrStatus, TripData, WotConnection, WebOfTrustData } from '@/types/nostr';
import cacheService from './cache';

// Bootstrap npubs for Web of Trust
const BOOTSTRAP_NPUBS: Record<string, string> = {
  'Free Madeira': 'npub1freemadeiraxxxxxxxxxxxxxxxxxw7wkd8',  // Replace with actual npub when available
  'MadTrips': 'npub1madtripxxxxxxxxxxxxxxxxxxxx98tsjk',       // Replace with actual npub when available
  'Sovereign Engineering': 'npub1sexpzzl3xpzc2k70ej2yqjsxzd88t528rl0wxslepmd8x7kdzpxqnmt5tx',
  'Funchal': 'npub1funchalxxxxxxxxxxxxxxxxxxxx4jk2m9'         // Replace with actual npub when available
};

class NostrService {
  private ndk: NDK | null = null;
  private signer: NDKSigner | null = null;
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://relay.snort.social',
  ];
  private connected: boolean = false;
  private connecting: boolean = false;
  private connectionError: Error | null = null;

  /**
   * Initialize the NDK instance
   */
  async init(explicitRelayUrls?: string[]): Promise<void> {
    if (this.connecting || this.connected) return;
    
    try {
      this.connecting = true;
      this.connectionError = null;
      const relayUrls = explicitRelayUrls || this.defaultRelays;
      
      console.log('Connecting to relays:', relayUrls);
      
      this.ndk = new NDK({
        explicitRelayUrls: relayUrls,
      });

      // Try to get NIP-07 signer (browser extension)
      try {
        this.signer = new NDKNip07Signer();
        this.ndk.signer = this.signer;
        
        try {
          const user = await this.signer.user();
          console.log('User signed in with pubkey:', user.pubkey);
        } catch (e) {
          console.error('Error getting user from signer:', e);
          this.signer = null;
          this.ndk.signer = undefined;
        }
      } catch (error) {
        console.log('No NIP-07 signer available');
        this.signer = null;
      }

      await this.ndk.connect();
      this.connected = true;
      this.connecting = false;
      console.log('NDK connected to relays');
      
      // Bootstrap Web of Trust data after connection
      this.bootstrapWebOfTrust().catch((err: Error) =>
        console.error("Failed to bootstrap Web of Trust:", err)
      );
    } catch (error) {
      this.connecting = false;
      this.connected = false;
      this.connectionError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to connect to relays:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): NostrStatus {
    return {
      connected: this.connected,
      connecting: this.connecting,
      relays: this.ndk && this.ndk.pool ? Array.from(this.ndk.pool.relays.keys() || []) : this.defaultRelays,
      error: this.connectionError
    };
  }

  /**
   * Set a private key signer
   */
  setPrivateKeySigner(privateKey: string): void {
    if (!this.ndk) {
      throw new Error('NDK not initialized');
    }
    this.signer = new NDKPrivateKeySigner(privateKey);
    this.ndk.signer = this.signer;
  }
  
  /**
   * Get the current user's public key
   */
  async getCurrentUserPubkey(): Promise<string | undefined> {
    if (!this.ndk || !this.signer) {
      return undefined;
    }
    
    try {
      const user = await this.signer.user();
      return user.pubkey;
    } catch (error) {
      console.error('Error getting current user pubkey:', error);
      return undefined;
    }
  }

  /**
   * Get bootstrap npubs for Web of Trust
   */
  getBootstrapNpubs(): Record<string, string> {
    return BOOTSTRAP_NPUBS;
  }

  /**
   * Get user by npub
   */
  getUserByNpub(npub: string): NDKUser | null {
    if (!this.ndk) return null;
    try {
      return this.ndk.getUser({ npub });
    } catch (error) {
      console.error('Error getting user by npub:', error);
      return null;
    }
  }

  /**
   * Fetch contacts (Kind 3 events) for a given pubkey
   */
  async fetchContacts(pubkey: string): Promise<Contact[]> {
    if (!this.ndk) {
      throw new Error('NDK not initialized');
    }
    
    try {
      console.log(`Fetching contacts for pubkey: ${pubkey}`);
      
      const filter: NDKFilter = {
        kinds: [NostrKind.CONTACTS as unknown as number],
        authors: [pubkey],
        limit: 1, // We only need the most recent one
      };
      
      const events = await this.ndk.fetchEvents(filter);
      let contacts: Contact[] = [];
      
      if (events.size > 0) {
        // Get the first (most recent) event
        const event = Array.from(events)[0];
        
        // Parse contacts from tags (pubkey, relay URL, petname)
        contacts = event.tags
          .filter((tag: string[]) => tag[0] === 'p')
          .map((tag: string[]) => {
            return {
              pubkey: tag[1],
              relay: tag[2] || '',
              petname: tag[3] || '',
              source: pubkey
            };
          });
          
        // Cache the contacts
        await cacheService.storeContacts(pubkey, contacts);
        
        console.log(`Found ${contacts.length} contacts for ${pubkey}`);
      } else {
        console.log(`No contacts found for ${pubkey}`);
      }
      
      return contacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * Bootstrap Web of Trust by fetching important profiles and their contacts
   */
  async bootstrapWebOfTrust(): Promise<void> {
    if (!this.ndk || !this.connected) {
      throw new Error('NDK not initialized or not connected to relays');
    }

    try {
      console.log('Bootstrapping Web of Trust data...');
      
      // Get profiles for bootstrap npubs
      for (const [name, npub] of Object.entries(BOOTSTRAP_NPUBS)) {
        try {
          console.log(`Fetching profile for ${name} (${npub})...`);
          await this.getProfile(npub);
          
          // Get user's pubkey from npub
          const user = this.getUserByNpub(npub);
          if (user && user.pubkey) {
            // Fetch contacts
            console.log(`Fetching contacts for ${name}...`);
            await this.fetchContacts(user.pubkey);
          }
        } catch (error) {
          console.error(`Error fetching data for ${name} (${npub}):`, error);
        }
      }
      
      // Also fetch the current user's data if signed in
      const currentUserPubkey = await this.getCurrentUserPubkey();
      if (currentUserPubkey) {
        await this.getProfile(currentUserPubkey);
        await this.fetchContacts(currentUserPubkey);
      }
      
      console.log('Web of Trust data bootstrapping complete');
    } catch (error) {
      console.error('Error bootstrapping Web of Trust data:', error);
      throw error;
    }
  }

  /**
   * Get a user profile
   */
  async getProfile(pubkey: string): Promise<NostrProfile | null> {
    if (!this.ndk) {
      throw new Error('NDK not initialized');
    }
    
    try {
      // Check cache first
      const cachedProfile = await cacheService.getProfile(pubkey);
      if (cachedProfile) {
        console.log(`Using cached profile for ${pubkey}`);
        return cachedProfile;
      }
      
      const user = this.ndk.getUser({ pubkey });
      await user.fetchProfile();
      
      if (!user.profile) {
        const basicProfile = {
          pubkey,
        };
        
        // Cache the basic profile
        await cacheService.storeProfile(basicProfile);
        
        return basicProfile;
      }
      
      const profile = {
        pubkey,
        displayName: user.profile.displayName,
        name: user.profile.name,
        about: user.profile.about,
        picture: user.profile.image,
        banner: user.profile.banner,
        nip05: user.profile.nip05,
        lud16: user.profile.lud16,
        website: user.profile.website,
      };
      
      // Cache the profile
      await cacheService.storeProfile(profile);
      
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Subscribe to trip events
   */
  subscribeToTrips(callback: (event: NDKEvent) => void): NDKSubscription | null {
    if (!this.ndk) {
      throw new Error('NDK not initialized');
    }
    
    const filter: NDKFilter = {
      kinds: [MadTripsKind.TRIP as unknown as number],
      limit: 100,
    };
    
    const subscription = this.ndk.subscribe(filter, { closeOnEose: false });
    
    subscription.on('event', (event: NDKEvent) => {
      callback(event);
    });
    
    return subscription;
  }

  /**
   * Publish a new trip
   */
  async publishTrip(tripData: Omit<TripData, 'id' | 'pubkey' | 'createdAt'>): Promise<NDKEvent | null> {
    if (!this.ndk || !this.signer) {
      throw new Error('NDK not initialized or user not signed in');
    }
    
    try {
      const event = new NDKEvent(this.ndk);
      event.kind = MadTripsKind.TRIP;
      event.content = JSON.stringify({
        title: tripData.title,
        description: tripData.description,
        startDate: tripData.startDate?.toISOString(),
        endDate: tripData.endDate?.toISOString(),
        location: tripData.location,
        coordinates: tripData.coordinates,
      });
      
      // Add tags
      if (tripData.tags && tripData.tags.length > 0) {
        tripData.tags.forEach(tag => {
          event.tags.push(['t', tag]);
        });
      }
      
      // Add general app tag
      event.tags.push(['t', 'madtrips']);
      
      // Add location tag if present
      if (tripData.location) {
        event.tags.push(['location', tripData.location]);
      }
      
      // Publish the event
      await event.publish();
      return event;
    } catch (error) {
      console.error('Error publishing trip:', error);
      return null;
    }
  }

  /**
   * Get trips by pubkey
   */
  async getTripsByPubkey(pubkey: string): Promise<TripData[]> {
    if (!this.ndk) {
      throw new Error('NDK not initialized');
    }
    
    const filter: NDKFilter = {
      kinds: [MadTripsKind.TRIP as unknown as number],
      authors: [pubkey],
    };
    
    try {
      const events = await this.ndk.fetchEvents(filter);
      const trips: TripData[] = [];
      
      events.forEach(event => {
        try {
          const content = JSON.parse(event.content);
          const tags = event.tags
            .filter((tag: string[]) => tag[0] === 't')
            .map((tag: string[]) => tag[1]);
          
          trips.push({
            id: event.id,
            title: content.title,
            description: content.description,
            startDate: content.startDate ? new Date(content.startDate) : undefined,
            endDate: content.endDate ? new Date(content.endDate) : undefined,
            location: content.location,
            coordinates: content.coordinates,
            tags,
            pubkey: event.pubkey,
            createdAt: event.created_at || 0,
          });
        } catch (error) {
          console.error('Error parsing trip data:', error);
        }
      });
      
      return trips;
    } catch (error) {
      console.error('Error fetching trips:', error);
      return [];
    }
  }

  /**
   * Find mutual connections between users
   */
  async findMutualConnections(pubkey1: string, pubkey2: string): Promise<string[]> {
    try {
      return cacheService.getMutualConnections(pubkey1, pubkey2);
    } catch (error) {
      console.error('Error finding mutual connections:', error);
      return [];
    }
  }

  /**
   * Check if a user is connected to another user
   */
  async isConnectedTo(pubkey: string, targetPubkey: string): Promise<boolean> {
    try {
      const contacts = cacheService.getContacts(pubkey);
      return contacts.some(contact => contact.pubkey === targetPubkey);
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  /**
   * Get Web of Trust recommendations for a user
   */
  /**
   * Get Web of Trust recommendations for a user
   * Returns profiles that are connected to the user's connections
   * @param pubkey User's public key
   * @param limit Maximum number of recommendations to return
   */
  async getWotRecommendations(pubkey: string, limit: number = 20): Promise<NostrProfile[]> {
    try {
      // Get user's connections with metadata
      const connections = cacheService.getUserConnections(pubkey, true, true);
      
      // Get connections of connections (2nd degree)
      const secondDegreeConnections: Set<string> = new Set();
      const userDirectConnections: Set<string> = new Set(
        connections.map(conn => conn.pubkey)
      );
      
      // For each connection, get their connections
      for (const conn of connections) {
        const connectionContacts = cacheService.getContacts(conn.pubkey);
        for (const contact of connectionContacts) {
          // Only include if not already a direct connection and not self
          if (!userDirectConnections.has(contact.pubkey) && contact.pubkey !== pubkey) {
            secondDegreeConnections.add(contact.pubkey);
          }
        }
      }
      
      // Get profiles for second-degree connections
      const recommendationProfiles: NostrProfile[] = [];
      // Convert Set to Array before iterating
      for (const connPubkey of Array.from(secondDegreeConnections)) {
        const profile = cacheService.getProfile(connPubkey);
        if (profile) {
          recommendationProfiles.push(profile);
        }
      }
      
      // Prioritize verified connections (with NIP-05)
      const recommendations = recommendationProfiles
        .sort((a, b) => {
          // Prioritize NIP-05 verified profiles
          if (a.nip05 && !b.nip05) return -1;
          if (!a.nip05 && b.nip05) return 1;
          return 0;
        })
        .slice(0, limit);
        
      return recommendations;
    } catch (error) {
      console.error('Error getting WOT recommendations:', error);
      return [];
    }
  }
  
  /**
   * Get Web of Trust connections for a user
   * @param pubkey User's public key
   * @param includeProfiles Include profile data for each connection
   */
  async getWotConnections(pubkey: string, includeProfiles: boolean = true): Promise<WotConnection[]> {
    try {
      // Get connections from cache service
      const connections = cacheService.getUserConnections(pubkey);
      
      // If profiles are requested but missing, fetch them
      if (includeProfiles) {
        const missingProfiles = connections.filter(conn => conn.profile === null);
        
        for (const conn of missingProfiles) {
          try {
            const profile = await this.getProfile(conn.pubkey);
            if (profile) {
              // Update the connection's profile
              conn.profile = profile;
            }
          } catch (err) {
            console.error(`Error fetching profile for ${conn.pubkey}:`, err);
          }
        }
      }
      
      return connections;
    } catch (error) {
      console.error('Error getting WOT connections:', error);
      return [];
    }
  }
  
  /**
   * Get Web of Trust summary for a user
   * @param pubkey User's public key
   */
  async getWotSummary(pubkey: string): Promise<WebOfTrustData> {
    try {
      // Get connections from cache
      const connections = await this.getWotConnections(pubkey);
      
      // Calculate statistics
      const mutualCount = connections.filter(conn => conn.isMutual).length;
      const verifiedCount = connections.filter(conn => conn.isVerified).length;
      const totalCount = connections.length;
      
      return {
        connections,
        mutualCount,
        verifiedCount,
        totalCount,
        stats: cacheService.getStats()
      };
    } catch (error) {
      console.error('Error getting WOT summary:', error);
      return {
        connections: [],
        mutualCount: 0,
        verifiedCount: 0,
        totalCount: 0,
        stats: cacheService.getStats()
      };
    }
  }
}

// Export as singleton
export const nostrService = new NostrService();
export default nostrService;
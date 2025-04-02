import React, { createContext, useState, useContext, useEffect } from 'react';
import NDK, { NDKEvent, NDKFilter, NDKUser, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { ProfileData, WOTState } from '../types';
import { CORE_NPUBS, CORE_NPUBS_OBJ } from '../constants/nostr';

const DEBUG_MODE = true; // Enable for more verbose logging

interface WOTContextType {
  wot: WOTState;
  addProfiles: (profiles: ProfileData[]) => void;
  updateProfile: (pubkey: string, data: Partial<ProfileData>) => void;
  isLoading: boolean;
  getTrustScore: (pubkey: string) => number;
  ndk: NDK | null;
  fetchInitialData: () => Promise<void>;
  dataInitialized: boolean;
}

const defaultState: WOTState = {
  profiles: {},
  seedUsers: CORE_NPUBS,
  loading: true,
  error: null,
};

const WOTContext = createContext<WOTContextType>({
  wot: defaultState,
  addProfiles: () => {},
  updateProfile: () => {},
  isLoading: true,
  getTrustScore: () => 0,
  ndk: null,
  fetchInitialData: async () => {},
  dataInitialized: false,
});

export const useWOT = () => useContext(WOTContext);

interface WOTProviderProps {
  children: React.ReactNode;
  ndk: NDK;
}

export const WOTProvider = ({ children, ndk }: WOTProviderProps) => {
  const [wot, setWOT] = useState<WOTState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const maxAttempts = 5; // Increased attempts

  // Centralized function to fetch initial data for all components
  const fetchInitialData = async () => {
    if (!ndk) return;
    
    // If already initialized but want to refetch, allow it
    if (dataInitialized) {
      console.log('Refetching data...');
    }
    
    setIsLoading(true);
    console.log('Fetching initial data for Web of Trust...');
    
    if (DEBUG_MODE) {
      console.log('DEBUG MODE: Active NDK instance:', ndk);
      console.log('DEBUG MODE: Relay status:', 
        Array.from(ndk.pool?.relays || []).map(([url, relay]) => ({ 
          url, 
          status: relay.status,
          connected: relay.connectivity?.connected
        }))
      );
    }
    
    try {
      // Check if we have at least one connected relay
      const connectedRelays = ndk.pool?.connectedRelays() || [];
      if (connectedRelays.length === 0) {
        console.log('No connected relays found, attempting to reconnect...');
        await ndk.connect(5000); // Try to connect with timeout
      }

      console.log('Connected relays:', ndk.pool?.connectedRelays().map(r => r.url) || []);
      
      // Start with seed users
      let processedPubkeys = new Set<string>();
      const nodesToProcess = [...CORE_NPUBS];
      
      // First, fetch profiles for seed users
      const seedProfiles: ProfileData[] = [];
      
      // Loop through core users with individual timeouts
      for (const pubkey of CORE_NPUBS) {
        try {
          console.log(`Fetching profile for ${pubkey}...`);
          const user = new NDKUser({ npub: pubkey });
          user.ndk = ndk;
          
          // Set individual timeout for each profile fetch
          const fetchPromise = user.fetchProfile({
            closeOnEose: true,        // Close subscription after EOSE
            groupable: false          // Don't group filters for better performance 
          });
          
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error(`Profile fetch timeout for ${pubkey}`)), 10000);
          });
          
          // Attempt with timeout
          await Promise.race([fetchPromise, timeoutPromise]);
          
          console.log(`Profile fetched for ${pubkey}:`, user.profile);
          
          const profile: ProfileData = {
            pubkey,
            name: user.profile?.name || pubkey.slice(0, 8),
            displayName: user.profile?.displayName || user.profile?.name || pubkey.slice(0, 8),
            picture: user.profile?.picture,
            about: user.profile?.about,
            metadata: user.profile || {},
            followers: [],
            following: [],
          };
          
          seedProfiles.push(profile);
          processedPubkeys.add(pubkey);
        } catch (error) {
          console.error(`Error fetching profile for ${pubkey}:`, error);
          // Continue with next profile
        }
      }
      
      if (seedProfiles.length === 0) {
        throw new Error("Failed to fetch any profiles");
      }
      
      // Add initial profiles
      addProfiles(seedProfiles);
      
      // Now fetch followings for each seed user to build the graph
      for (const profile of seedProfiles) {
        try {
          console.log(`Fetching followings for ${profile.pubkey}...`);
          const followings = await fetchFollowings(profile.pubkey);
          console.log(`Fetched ${followings.length} followings for ${profile.pubkey}`);
          
          updateProfile(profile.pubkey, { following: followings });
          
          // Add each following to the list to process (to get their profiles)
          for (const following of followings) {
            if (!processedPubkeys.has(following) && !nodesToProcess.includes(following)) {
              nodesToProcess.push(following);
            }
          }
        } catch (error) {
          console.error(`Error fetching followings for ${profile.pubkey}:`, error);
        }
      }
      
      // Fetch profiles for next level of users (limited to prevent overloading)
      const maxAdditionalProfiles = 15; // Smaller batch size
      const additionalProfiles: ProfileData[] = [];
      
      // Process in smaller batches with timeouts
      const processCount = Math.min(nodesToProcess.length, maxAdditionalProfiles);
      for (let i = 0; i < processCount; i++) {
        const currentPubkey = nodesToProcess[i];
        if (!currentPubkey || processedPubkeys.has(currentPubkey)) continue;
        
        try {
          console.log(`Fetching additional profile for ${currentPubkey}...`);
          const user = new NDKUser({ npub: currentPubkey });
          
          // Set timeout for each profile fetch
          const fetchPromise = user.fetchProfile();
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error(`Profile fetch timeout for ${currentPubkey}`)), 5000);
          });
          
          await Promise.race([fetchPromise, timeoutPromise]);
          
          const profile: ProfileData = {
            pubkey: currentPubkey,
            name: user.profile?.name || currentPubkey.slice(0, 8),
            displayName: user.profile?.displayName || user.profile?.name || currentPubkey.slice(0, 8),
            picture: user.profile?.picture,
            about: user.profile?.about,
            metadata: user.profile || {},
            followers: [],
            following: [],
          };
          
          additionalProfiles.push(profile);
          processedPubkeys.add(currentPubkey);
          
          // Also fetch their followings but with a short timeout
          try {
            const followingsPromise = fetchFollowings(currentPubkey);
            const followingsTimeoutPromise = new Promise<string[]>((_, reject) => {
              setTimeout(() => reject(new Error(`Followings fetch timeout for ${currentPubkey}`)), 3000);
            });
            
            const followings = await Promise.race([followingsPromise, followingsTimeoutPromise]);
            profile.following = followings;
          } catch (error) {
            console.error(`Error or timeout fetching followings for ${currentPubkey}:`, error);
            profile.following = [];
          }
        } catch (error) {
          console.error(`Error fetching profile for ${currentPubkey}:`, error);
        }
      }
      
      // Add additional profiles
      if (additionalProfiles.length > 0) {
        addProfiles(additionalProfiles);
      }
      
      // If we have any data, consider it a success
      if (seedProfiles.length > 0) {
        setDataInitialized(true);
        console.log('Initial data loaded successfully - profiles:', seedProfiles.length, 'additional:', additionalProfiles.length);
      } else {
        throw new Error("Failed to fetch required profiles");
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      
      // Retry if we haven't exceeded max attempts
      if (fetchAttempts < maxAttempts) {
        setFetchAttempts(prev => prev + 1);
        console.log(`Retrying data fetch (${fetchAttempts + 1}/${maxAttempts})...`);
        
        // Wait longer between retries
        setTimeout(() => {
          fetchInitialData();
        }, 5000 * (fetchAttempts + 1)); // Increasing backoff
      } else {
        // Still mark as initialized even if failed
        setDataInitialized(true);
        console.error('Maximum retry attempts reached. Some data may be missing.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to fetch followings for a pubkey
  const fetchFollowings = async (pubkey: string): Promise<string[]> => {
    try {
      const filter: NDKFilter = {
        kinds: [3], // contact lists
        authors: [pubkey],
        limit: 1, // Only need the most recent contact list
      };
      
      if (DEBUG_MODE) console.log(`DEBUG MODE: Submitting filter for followings of ${pubkey}:`, filter);
      
      // Set timeout for better development experience
      const fetchPromise = ndk.fetchEvents(filter);
      const timeoutPromise = new Promise<any>((_, reject) => {
        setTimeout(() => {
          if (DEBUG_MODE) console.log(`DEBUG MODE: Timeout reached for followings of ${pubkey}`);
          reject(new Error(`Timeout fetching followings for ${pubkey}`));
        }, 6000);
      });
      
      // Race between the actual fetch and the timeout
      const events = await Promise.race([fetchPromise, timeoutPromise]);
      let followings: string[] = [];
      
      events.forEach((event: NDKEvent) => {
        // Extract pubkeys from tags
        const pubkeys = event.tags
          .filter(tag => tag[0] === 'p')
          .map(tag => tag[1]);
        
        followings = [...followings, ...pubkeys];
      });
      
      return [...new Set(followings)]; // Remove duplicates
    } catch (error) {
      console.error(`Error fetching followings for ${pubkey}:`, error);
      return [];
    }
  };

  const addProfiles = (profiles: ProfileData[]) => {
    setWOT((prev: WOTState) => {
      const newProfiles = { ...prev.profiles };
      profiles.forEach(profile => {
        newProfiles[profile.pubkey] = {
          ...profile,
          followers: profile.followers || [],
          following: profile.following || [],
        };
      });
      return { ...prev, profiles: newProfiles };
    });
  };

  const updateProfile = (pubkey: string, data: Partial<ProfileData>) => {
    setWOT((prev: WOTState) => {
      if (!prev.profiles[pubkey]) return prev;
      
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [pubkey]: {
            ...prev.profiles[pubkey],
            ...data,
          }
        }
      };
    });
  };

  const getTrustScore = (pubkey: string): number => {
    // Direct trust: included in CORE_NPUBS
    if (CORE_NPUBS.includes(pubkey)) return 1.0;

    const profile = wot.profiles[pubkey];
    if (!profile) return 0;

    // Calculate based on connections to core users
    const directConnections = profile.following.filter(
      (following: string) => CORE_NPUBS.includes(following)
    ).length;
    
    // Simple formula: base score + bonus for each connection to core
    const baseScore = 0.1;
    const connectionScore = directConnections * 0.2;
    
    return Math.min(baseScore + connectionScore, 0.9); // Cap at 0.9
  };

  // Automatically fetch initial data when NDK is available
  useEffect(() => {
    if (ndk && !dataInitialized) {
      // Add a slight delay to ensure NDK connection is stable
      setTimeout(() => {
        fetchInitialData();
      }, 1000);
    }
  }, [ndk, dataInitialized]);

  // Listen for force-load events
  useEffect(() => {
    if (!ndk) return;
    
    const handleForceLoad = () => {
      console.log('WOTContext: Received force-load event');
      // Always retry data fetching when forced
      setDataInitialized(false);
      setFetchAttempts(0);
      fetchInitialData();
    };
    
    window.addEventListener('force-wot-load', handleForceLoad);
    
    return () => {
      window.removeEventListener('force-wot-load', handleForceLoad);
    };
  }, [ndk]);

  const value: WOTContextType = {
    wot,
    addProfiles,
    updateProfile,
    isLoading,
    getTrustScore,
    ndk,
    fetchInitialData,
    dataInitialized
  };

  return (
    <WOTContext.Provider value={value}>
      {children}
    </WOTContext.Provider>
  );
}; 
import { useState, useEffect, useCallback } from 'react';
import NDK, { NDKEvent, NDKFilter, NDKSubscription, NDKUser, NostrEvent } from '@nostr-dev-kit/ndk';
import { useWOT } from '../context/WOTContext';
import { Post, ProfileData } from '../types';
import { processNostrEvent } from '../utils/mcp';
import { MADEIRA_HASHTAGS, DEFAULT_RELAYS } from '../constants/nostr';

// Only declare nostrLogin as it's not included in NDK's types
declare global {
  interface Window {
    nostrLogin?: {
      __nlInitialized: boolean;
    };
  }
}

export function useNostr() {
  const { ndk, wot, addProfiles } = useWOT();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<NDKUser | null>(null);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [ndkReady, setNdkReady] = useState<boolean>(false);
  
  // Check NDK connection status
  useEffect(() => {
    setNdkReady(!!ndk);
  }, [ndk]);

  // Reconnect to relays
  const reconnect = useCallback(async () => {
    try {
      if (ndk) {
        await ndk.connect();
        setNdkReady(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reconnect to relays:', error);
      return false;
    }
  }, [ndk]);

  // Login with Nostr
  const login = useCallback(async () => {
    if (!ndk || !window.nostr) {
      throw new Error('NDK or window.nostr not available');
    }

    try {
      // Cast window.nostr to any to access the methods
      const nostr = window.nostr as any;
      
      // Create user from current extension
      const currentUser = new NDKUser({
        pubkey: await nostr.getPublicKey()
      });
      
      // Set NDK user - using correct method call
      if (ndk.signer) {
        // Access the signer's setActiveUser method
        (ndk.signer as any).setActiveUser?.(currentUser);
      }
      
      // Get profile info
      await currentUser.fetchProfile();
      
      // Update user state
      setUser(currentUser);
      
      // Set profile picture if available
      if (currentUser.profile?.picture) {
        setUserProfilePicture(currentUser.profile.picture);
      }
      
      return currentUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [ndk]);

  // Logout
  const logout = useCallback(() => {
    if (ndk && ndk.signer) {
      // Clear the active user
      (ndk.signer as any).setActiveUser?.(null);
    }
    setUser(null);
    setUserProfilePicture(null);
  }, [ndk]);
  
  // Fetch profile data for a given pubkey
  const fetchProfile = useCallback(async (pubkey: string) => {
    if (!ndk) return null;
    
    try {
      const user = new NDKUser({ pubkey });
      await user.fetchProfile();
      
      const profile: ProfileData = {
        pubkey,
        name: user.profile?.name,
        displayName: user.profile?.displayName || user.profile?.name,
        picture: user.profile?.picture,
        about: user.profile?.about,
        metadata: user.profile || {},
        followers: [],
        following: [],
      };
      
      return profile;
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      return null;
    }
  }, [ndk]);
  
  // Fetch multiple profiles
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    if (!ndk) return [];
    
    const profiles: ProfileData[] = [];
    
    // Fetch in batches to avoid overwhelming relays
    const batchSize = 10;
    for (let i = 0; i < pubkeys.length; i += batchSize) {
      const batch = pubkeys.slice(i, i + batchSize);
      const batchPromises = batch.map(pubkey => fetchProfile(pubkey));
      
      const batchResults = await Promise.all(batchPromises);
      profiles.push(...batchResults.filter(Boolean) as ProfileData[]);
    }
    
    return profiles;
  }, [ndk, fetchProfile]);
  
  // Fetch follows for a pubkey
  const fetchFollowings = useCallback(async (pubkey: string) => {
    if (!ndk) return [];
    
    try {
      const filter: NDKFilter = {
        kinds: [3], // contact lists
        authors: [pubkey],
        limit: 1, // Only need the most recent contact list
      };
      
      const events = await ndk.fetchEvents(filter);
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
  }, [ndk]);
  
  // Fetch posts matching a filter
  const fetchPosts = useCallback(async (filter: NDKFilter) => {
    if (!ndk) return [];
    
    try {
      const events = await ndk.fetchEvents(filter);
      const posts: Post[] = [];
      
      events.forEach((event: NDKEvent) => {
        // Process event with MCP to extract hashtags and images
        const processedPost = processNostrEvent(event);
        if (processedPost) {
          posts.push(processedPost);
        }
      });
      
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }, [ndk]);
  
  // Fetch posts related to Madeira
  const fetchMadeiraPosts = useCallback(async () => {
    if (!ndk) return [];
    
    try {
      // Create filters with Madeira hashtags
      const filters: NDKFilter[] = MADEIRA_HASHTAGS.map(tag => ({
        kinds: [1], // text notes
        limit: 20,
        since: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Last 30 days
        '#t': [tag],
      }));
      
      // Fetch events for all hashtags
      const allEvents: NDKEvent[] = [];
      
      for (const filter of filters) {
        const events = await ndk.fetchEvents(filter);
        events.forEach(event => allEvents.push(event));
      }
      
      // Process events into posts
      const posts: Post[] = [];
      
      allEvents.forEach((event: NDKEvent) => {
        const processedPost = processNostrEvent(event);
        if (processedPost) {
          posts.push(processedPost);
        }
      });
      
      return posts;
    } catch (error) {
      console.error('Error fetching Madeira posts:', error);
      return [];
    }
  }, [ndk]);

  return {
    fetchProfile,
    fetchProfiles,
    fetchFollowings,
    fetchPosts,
    fetchMadeiraPosts,
    posts,
    loading,
    setPosts,
    user,
    login,
    logout,
    userProfilePicture,
    ndkReady,
    reconnect
  };
} 
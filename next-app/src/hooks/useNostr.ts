'use client';

import { useCallback, useEffect, useState } from 'react';
import nostrService from '@/services/nostr';
import { NostrProfile, NostrStatus, WotConnection, WebOfTrustData } from '@/types/nostr';
import { NDKUser } from '@nostr-dev-kit/ndk';

/**
 * Hook for interacting with Nostr network
 * Provides methods to connect, sign in, and access Web of Trust data
 */
export default function useNostr() {
  const [status, setStatus] = useState<NostrStatus>({
    connected: false,
    connecting: false,
    relays: [],
    error: null,
  });
  
  const [currentUser, setCurrentUser] = useState<NostrProfile | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean>(false);

  /**
   * Connect to Nostr network
   */
  const connect = useCallback(async (relays?: string[]) => {
    if (status.connected || status.connecting) return;
    
    try {
      setStatus(prev => ({ ...prev, connecting: true, error: null }));
      await nostrService.init(relays);
      
      // Update status
      const newStatus = nostrService.getStatus();
      setStatus(newStatus);
      
      // Try to get current user
      const pubkey = await nostrService.getCurrentUserPubkey();
      if (pubkey) {
        const profile = await nostrService.getProfile(pubkey);
        setCurrentUser(profile);
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connecting: false,
        connected: false,
        error: error instanceof Error ? error : new Error(String(error))
      }));
    }
  }, [status.connected, status.connecting]);

  /**
   * Bootstrap Web of Trust data
   */
  const bootstrapWot = useCallback(async () => {
    if (!status.connected || isBootstrapped) return;
    
    try {
      await nostrService.bootstrapWebOfTrust();
      setIsBootstrapped(true);
    } catch (error) {
      console.error('Error bootstrapping Web of Trust:', error);
    }
  }, [status.connected, isBootstrapped]);

  /**
   * Set a private key for signing
   */
  const setPrivateKey = useCallback((privateKey: string) => {
    try {
      nostrService.setPrivateKeySigner(privateKey);
    } catch (error) {
      console.error('Error setting private key:', error);
    }
  }, []);

  /**
   * Get a profile by pubkey or npub
   */
  const getProfile = useCallback(async (pubkeyOrNpub: string): Promise<NostrProfile | null> => {
    if (!status.connected) {
      throw new Error('Not connected to Nostr');
    }
    
    try {
      // Check if the input is an npub
      if (pubkeyOrNpub.startsWith('npub')) {
        const user = nostrService.getUserByNpub(pubkeyOrNpub);
        if (user && user.pubkey) {
          return await nostrService.getProfile(user.pubkey);
        }
        return null;
      }
      
      // If not an npub, treat as pubkey
      return await nostrService.getProfile(pubkeyOrNpub);
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }, [status.connected]);

  /**
   * Get Web of Trust connections for a user
   */
  const getWotConnections = useCallback(async (pubkeyOrNpub: string): Promise<WotConnection[]> => {
    if (!status.connected) {
      throw new Error('Not connected to Nostr');
    }
    
    try {
      let pubkey = pubkeyOrNpub;
      
      // Handle npub
      if (pubkeyOrNpub.startsWith('npub')) {
        const user = nostrService.getUserByNpub(pubkeyOrNpub);
        if (!user || !user.pubkey) {
          throw new Error('Invalid npub');
        }
        pubkey = user.pubkey;
      }
      
      return await nostrService.getWotConnections(pubkey);
    } catch (error) {
      console.error('Error getting WOT connections:', error);
      return [];
    }
  }, [status.connected]);

  /**
   * Get Web of Trust recommendations for a user
   */
  const getWotRecommendations = useCallback(async (pubkeyOrNpub: string, limit: number = 20): Promise<NostrProfile[]> => {
    if (!status.connected) {
      throw new Error('Not connected to Nostr');
    }
    
    try {
      let pubkey = pubkeyOrNpub;
      
      // Handle npub
      if (pubkeyOrNpub.startsWith('npub')) {
        const user = nostrService.getUserByNpub(pubkeyOrNpub);
        if (!user || !user.pubkey) {
          throw new Error('Invalid npub');
        }
        pubkey = user.pubkey;
      }
      
      return await nostrService.getWotRecommendations(pubkey, limit);
    } catch (error) {
      console.error('Error getting WOT recommendations:', error);
      return [];
    }
  }, [status.connected]);

  /**
   * Get Web of Trust summary for a user
   */
  const getWotSummary = useCallback(async (pubkeyOrNpub: string): Promise<WebOfTrustData> => {
    if (!status.connected) {
      throw new Error('Not connected to Nostr');
    }
    
    try {
      let pubkey = pubkeyOrNpub;
      
      // Handle npub
      if (pubkeyOrNpub.startsWith('npub')) {
        const user = nostrService.getUserByNpub(pubkeyOrNpub);
        if (!user || !user.pubkey) {
          throw new Error('Invalid npub');
        }
        pubkey = user.pubkey;
      }
      
      return await nostrService.getWotSummary(pubkey);
    } catch (error) {
      console.error('Error getting WOT summary:', error);
      return {
        connections: [],
        mutualCount: 0,
        verifiedCount: 0,
        totalCount: 0,
        stats: { profiles: 0, contacts: 0, lastUpdated: null }
      };
    }
  }, [status.connected]);

  /**
   * Check if two users are mutually connected
   */
  const areMutuallyConnected = useCallback(async (pubkey1: string, pubkey2: string): Promise<boolean> => {
    try {
      if (!status.connected) return false;
      const mutualConnections = await nostrService.findMutualConnections(pubkey1, pubkey2);
      return mutualConnections.length > 0;
    } catch (error) {
      console.error('Error checking mutual connection:', error);
      return false;
    }
  }, [status.connected]);

  // Connect to Nostr on component mount
  useEffect(() => {
    if (!status.connected && !status.connecting) {
      connect();
    }
  }, [connect, status.connected, status.connecting]);

  // Bootstrap Web of Trust data after connection
  useEffect(() => {
    if (status.connected && !isBootstrapped) {
      bootstrapWot();
    }
  }, [status.connected, isBootstrapped, bootstrapWot]);

  return {
    // Status
    status,
    connected: status.connected,
    connecting: status.connecting,
    error: status.error,
    isBootstrapped,
    currentUser,
    
    // Methods
    connect,
    setPrivateKey,
    getProfile,
    getWotConnections,
    getWotRecommendations,
    getWotSummary,
    areMutuallyConnected,
  };
}
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import nostrService from '@/services/nostr';
import { NostrProfile, TripData } from '@/types/nostr';

interface NostrContextType {
  isConnected: boolean;
  isSignedIn: boolean;
  currentUser: NostrProfile | null;
  connect: (relays?: string[]) => Promise<void>;
  signIn: (privateKey?: string) => Promise<boolean>;
  signOut: () => void;
  publishTrip: (tripData: Omit<TripData, 'id' | 'pubkey' | 'createdAt'>) => Promise<TripData | null>;
  getUserTrips: (pubkey: string) => Promise<TripData[]>;
  getProfile: (pubkey: string) => Promise<NostrProfile | null>;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

export const useNostr = (): NostrContextType => {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  return context;
};

interface NostrProviderProps {
  children: ReactNode;
  initialRelays?: string[];
}

export const NostrProvider: React.FC<NostrProviderProps> = ({ 
  children, 
  initialRelays 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<NostrProfile | null>(null);

  // Initialize Nostr connection
  useEffect(() => {
    const initNostr = async () => {
      try {
        await nostrService.init(initialRelays);
        setIsConnected(true);
        
        // Check if user is already signed in
        const pubkey = await nostrService.getCurrentUserPubkey();
        if (pubkey) {
          const profile = await nostrService.getProfile(pubkey);
          if (profile) {
            setCurrentUser(profile);
            setIsSignedIn(true);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Nostr:', error);
        setIsConnected(false);
      }
    };

    initNostr();
  }, [initialRelays]);

  // Connect to Nostr relays
  const connect = async (relays?: string[]) => {
    try {
      await nostrService.init(relays);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to Nostr relays:', error);
      setIsConnected(false);
    }
  };

  // Sign in with private key or browser extension
  const signIn = async (privateKey?: string): Promise<boolean> => {
    try {
      if (privateKey) {
        nostrService.setPrivateKeySigner(privateKey);
      }
      
      const pubkey = await nostrService.getCurrentUserPubkey();
      if (!pubkey) {
        return false;
      }
      
      const profile = await nostrService.getProfile(pubkey);
      if (profile) {
        setCurrentUser(profile);
        setIsSignedIn(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    }
  };

  // Sign out
  const signOut = () => {
    setIsSignedIn(false);
    setCurrentUser(null);
  };

  // Publish a trip
  const publishTrip = async (
    tripData: Omit<TripData, 'id' | 'pubkey' | 'createdAt'>
  ): Promise<TripData | null> => {
    try {
      const event = await nostrService.publishTrip(tripData);
      
      if (!event) {
        return null;
      }
      
      const content = JSON.parse(event.content);
      const tags = event.tags
        .filter(tag => tag[0] === 't')
        .map(tag => tag[1]);
      
      return {
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
      };
    } catch (error) {
      console.error('Failed to publish trip:', error);
      return null;
    }
  };

  // Get user trips
  const getUserTrips = async (pubkey: string): Promise<TripData[]> => {
    return await nostrService.getTripsByPubkey(pubkey);
  };

  // Get user profile
  const getProfile = async (pubkey: string): Promise<NostrProfile | null> => {
    return await nostrService.getProfile(pubkey);
  };

  const value = {
    isConnected,
    isSignedIn,
    currentUser,
    connect,
    signIn,
    signOut,
    publishTrip,
    getUserTrips,
    getProfile,
  };

  return (
    <NostrContext.Provider value={value}>
      {children}
    </NostrContext.Provider>
  );
};
'use client';

import React, { useState, useEffect } from 'react';
import { useNostr } from '@/contexts/NostrContext';
import ProfileCard from '@/components/ProfileCard';
import { NostrProfile } from '@/types/nostr';

export default function Home() {
  const { isConnected, isSignedIn, currentUser, signIn } = useNostr();
  const [isLoading, setIsLoading] = useState(true);
  const [loginKey, setLoginKey] = useState('');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginKey) {
      setIsLoading(true);
      await signIn(loginKey);
      setIsLoading(false);
      setLoginKey('');
    }
  };

  return (
    <div className="container-main py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold">MadTrips</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Your Nostr-powered Travel Companion
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-foreground p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Welcome to MadTrips</h2>
          
          <p className="mb-4">
            MadTrips is a decentralized travel application built on Nostr.
            Share your trips, discover new places, and connect with travelers around the world.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Share your travel experiences on the Nostr network</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Discover new destinations from other travelers</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Support content creators with Lightning Network tips</span>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="font-medium">Nostr Connection Status:</p>
            <div className="flex items-center mt-2">
              <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected to Nostr network' : 'Disconnected from Nostr network'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-foreground p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">
            {isSignedIn ? 'Your Profile' : 'Sign In'}
          </h2>
          
          {isSignedIn && currentUser ? (
            <div>
              <ProfileCard profile={currentUser} />
              
              <div className="mt-6">
                <button className="btn-primary w-full">
                  View My Trips
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Sign in with your Nostr extension (NIP-07) or private key to access all features.
              </p>
              
              <form onSubmit={handleSignIn}>
                <div className="mb-4">
                  <label htmlFor="privateKey" className="block text-sm font-medium mb-1">
                    Private Key (nsec)
                  </label>
                  <input
                    type="password"
                    id="privateKey"
                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800"
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    placeholder="Enter your private key"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In with Key'}
                </button>
                
                <div className="mt-4 text-center">
                  <span className="text-sm">Or</span>
                </div>
                
                <button 
                  type="button"
                  className="btn-secondary w-full mt-4"
                  onClick={() => signIn()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Sign In with Extension'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
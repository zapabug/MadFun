'use client';

import React, { useState, useEffect } from 'react';
import useNostr from '@/hooks/useNostr';
import { NostrProfile, WotConnection } from '@/types/nostr';

interface WebOfTrustDisplayProps {
  pubkey?: string;
}

const WebOfTrustDisplay: React.FC<WebOfTrustDisplayProps> = ({ pubkey }) => {
  const {
    status,
    connected,
    connecting,
    error,
    currentUser,
    getProfile,
    getWotRecommendations,
    getWotConnections,
  } = useNostr();

  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [recommendations, setRecommendations] = useState<NostrProfile[]>([]);
  const [connections, setConnections] = useState<WotConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Use the provided pubkey or the current user's pubkey
  const targetPubkey = pubkey || (currentUser?.pubkey || '');

  // Load data when component mounts or when pubkey changes
  useEffect(() => {
    const loadData = async () => {
      if (!connected || !targetPubkey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get the profile
        const profileData = await getProfile(targetPubkey);
        setProfile(profileData);

        // Get WOT recommendations
        const wotRecommendations = await getWotRecommendations(targetPubkey);
        setRecommendations(wotRecommendations);

        // Get WOT connections
        const wotConnections = await getWotConnections(targetPubkey);
        setConnections(wotConnections);
      } catch (err) {
        console.error('Error loading Web of Trust data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [connected, targetPubkey, getProfile, getWotRecommendations, getWotConnections]);

  if (!connected) {
    return (
      <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg">
        <h2 className="text-lg font-bold text-orange-700">Not Connected to Nostr</h2>
        <p className="text-orange-600">
          {connecting ? 'Connecting to Nostr relays...' : 'Please connect to Nostr to view Web of Trust data.'}
        </p>
        {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-bold">Loading Web of Trust Data...</h2>
        <div className="animate-pulse mt-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <h2 className="text-lg font-bold text-red-700">Profile Not Found</h2>
        <p className="text-red-600">
          Could not find a profile for the provided pubkey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">
          {profile.displayName || profile.name || 'Anonymous'}
        </h2>
        {profile.picture && (
          <img
            src={profile.picture}
            alt={profile.displayName || profile.name || 'Profile picture'}
            className="w-16 h-16 rounded-full mt-2 object-cover"
          />
        )}
        {profile.nip05 && (
          <p className="text-green-600 flex items-center mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {profile.nip05}
          </p>
        )}
        <p className="text-gray-600 mt-2">{profile.about}</p>
      </div>

      {/* Web of Trust Connections */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Web of Trust Connections</h2>
        {connections.length === 0 ? (
          <p className="text-gray-500 italic">No connections found in the Web of Trust.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <div key={connection.pubkey} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  {connection.profile?.picture && (
                    <img
                      src={connection.profile.picture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {connection.profile?.displayName || 
                       connection.profile?.name || 
                       connection.pubkey.substring(0, 8) + '...'}
                    </h3>
                    <div className="flex space-x-2 mt-1">
                      {connection.isMutual && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Mutual
                        </span>
                      )}
                      {connection.isVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="text-gray-500 italic">No recommendations from the Web of Trust.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendations.map((profile) => (
              <div key={profile.pubkey} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  {profile.picture && (
                    <img
                      src={profile.picture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {profile.displayName || profile.name || profile.pubkey.substring(0, 8) + '...'}
                    </h3>
                    {profile.nip05 && (
                      <p className="text-green-600 text-sm">
                        {profile.nip05}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Section */}
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-bold text-gray-700 mb-2">Debug Information</h2>
        <div className="text-sm font-mono bg-gray-800 text-gray-200 p-3 rounded overflow-auto">
          <p>Connected: {connected ? 'Yes' : 'No'}</p>
          <p>Relays: {status.relays.join(', ')}</p>
          <p>Connections: {connections.length}</p>
          <p>Recommendations: {recommendations.length}</p>
          <p>Pubkey: {targetPubkey}</p>
        </div>
      </div>
    </div>
  );
};

export default WebOfTrustDisplay;
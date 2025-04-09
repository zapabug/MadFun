'use client';

import { useState } from 'react';
import WebOfTrustDisplay from '@/components/WebOfTrustDisplay';
import useNostr from '@/hooks/useNostr';

export default function WebOfTrustPage() {
  const { connected, connecting, status, error } = useNostr();
  const [pubkeyOrNpub, setPubkeyOrNpub] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPubkeyOrNpub(searchInput);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Web of Trust</h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100">
        <h2 className="text-xl font-semibold mb-2">Nostr Connection Status</h2>
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : connecting ? 'bg-yellow-500' : 'bg-red-500'}`}
          />
          <span className="text-gray-700">
            {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        {error && (
          <div className="mt-2 text-red-600">
            Error: {error.message}
          </div>
        )}
        {status.relays.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <div>Connected to relays:</div>
            <ul className="list-disc pl-5">
              {status.relays.map((relay, index) => (
                <li key={index}>{relay}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Search Form */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter pubkey or npub"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
            disabled={!connected || !searchInput.trim()}
          >
            Search
          </button>
        </form>
        
        {/* Bootstrap pubkeys */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Bootstrap Profiles:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchInput('npub1sexpzzl3xpzc2k70ej2yqjsxzd88t528rl0wxslepmd8x7kdzpxqnmt5tx')}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
            >
              Sovereign Engineering
            </button>
            <button
              onClick={() => setSearchInput('npub1freemadeiraxxxxxxxxxxxxxxxxxw7wkd8')}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
            >
              Free Madeira
            </button>
            <button
              onClick={() => setSearchInput('npub1madtripxxxxxxxxxxxxxxxxxxxx98tsjk')}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
            >
              MadTrips
            </button>
            <button
              onClick={() => setSearchInput('npub1funchalxxxxxxxxxxxxxxxxxxxx4jk2m9')}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
            >
              Funchal
            </button>
          </div>
        </div>
      </div>
      
      {/* Web of Trust Display */}
      {pubkeyOrNpub ? (
        <WebOfTrustDisplay pubkey={pubkeyOrNpub} />
      ) : (
        <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Enter a pubkey or npub</h2>
          <p className="text-gray-600">
            Input a Nostr public key or npub to view their Web of Trust connections.
          </p>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useNostr } from '@/contexts/NostrContext';
import { TripData } from '@/types/nostr';
import { formatRelativeTime } from '@/utils/helpers';

export default function TripsPage() {
  const { isSignedIn, currentUser, getUserTrips } = useNostr();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTrips() {
      if (isSignedIn && currentUser) {
        setIsLoading(true);
        try {
          const userTrips = await getUserTrips(currentUser.pubkey);
          setTrips(userTrips);
        } catch (error) {
          console.error('Failed to load trips:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadTrips();
  }, [isSignedIn, currentUser, getUserTrips]);

  if (!isSignedIn) {
    return (
      <div className="container-main py-10">
        <div className="bg-white dark:bg-foreground p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p>You need to sign in to view your trips</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <button className="btn-primary">
          Create New Trip
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-foreground p-6 rounded-lg shadow-md animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white dark:bg-foreground p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold">{trip.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {trip.location && (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {trip.location}
                  </span>
                )}
              </p>
              <p className="mb-4 line-clamp-2">{trip.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {formatRelativeTime(trip.createdAt)}
                </span>
                <div className="flex space-x-1">
                  {trip.tags.map((tag, index) => (
                    <span key={index} className="bg-primary/10 text-primary px-2 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-foreground p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-2">No Trips Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You haven't created any trips yet. Start sharing your travel experiences!
          </p>
          <button className="btn-primary">
            Create Your First Trip
          </button>
        </div>
      )}
    </div>
  );
}
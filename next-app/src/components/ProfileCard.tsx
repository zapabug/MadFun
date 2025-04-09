import React from 'react';
import Image from 'next/image';
import { NostrProfile } from '@/types/nostr';

interface ProfileCardProps {
  profile: NostrProfile;
  isLoading?: boolean;
  onClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile,
  isLoading = false,
  onClick
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-foreground rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || profile.name || `npub...${profile.pubkey.slice(-6)}`;
  
  return (
    <div 
      className="bg-white dark:bg-foreground rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        {profile.picture ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden">
            <Image 
              src={profile.picture}
              alt={displayName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          
          {profile.nip05 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {profile.nip05}
            </p>
          )}
          
          {profile.about && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
              {profile.about}
            </p>
          )}
        </div>
      </div>

      {profile.lud16 && (
        <div className="mt-4 flex justify-end">
          <button className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Zap
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
import React, { useEffect, useState } from 'react';
import NDK, { NDKUser } from '@nostr-dev-kit/ndk';
import { WOTProvider } from './context/WOTContext';
import Billboard from './components/Billboard';
import SocialGraph from './components/SocialGraph';
import SocialFeed from './components/SocialFeed';
import NostrLoginButton from './components/login/NostrLoginButton';
import { DEFAULT_RELAYS, MADEIRA_HASHTAGS, CORE_NPUBS_OBJ, RELAYS } from './constants/nostr';

// IMPORTANT: Always show content flag - even if data fails to load
const FORCE_SHOW_UI = true;

// Add error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2>Something went wrong:</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Feature flags to enable/disable components
const ENABLE_FEATURES = {
  BILLBOARD: true,
  SOCIAL_GRAPH: true,
  SOCIAL_FEED: true,
  LOGIN_BUTTON: true
};

// Main App component
const App: React.FC = () => {
  const [ndk, setNDK] = useState<NDK | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [showUI, setShowUI] = useState(FORCE_SHOW_UI);
  
  // Initialize NDK on mount
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds
    
    // Force UI to show after 5 seconds regardless of connection state
    const forceUITimer = setTimeout(() => {
      if (mounted) {
        console.log('Forcing UI to display after timeout');
        setShowUI(true);
      }
    }, 5000);
    
    const initNDK = async () => {
      if (!mounted) return;
      
      setConnectionAttempt(prev => prev + 1);
      
      try {
        console.log('Initializing NDK with optimized settings...');
        
        // Use more relays for better connectivity
        const relaysToUse = [
          "wss://relay.damus.io",
          "wss://nos.lol", 
          "wss://relay.snort.social",
          "wss://relay.nostr.band",
          "wss://purplepag.es",
          "wss://nostr.mutinywallet.com",
          "wss://relay.nostr.info"
        ];
        
        console.log('Using relays:', relaysToUse);
        
        // Create NDK instance with better timeout settings
        const ndkInstance = new NDK({
          explicitRelayUrls: relaysToUse,
          autoConnectUserRelays: false, // Don't automatically connect to user relays until we have a connection
          autoFetchUserMutelist: false  // Same for mute list
        });
        
        // Connect to relays with dedicated timeout
        console.log('Connecting to Nostr network...');
        
        // Connect to relays, with better error handling
        try {
          const connectionPromise = ndkInstance.connect();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          );
          
          await Promise.race([connectionPromise, timeoutPromise]);
          console.log('Connected to Nostr relays');
        } catch (connErr) {
          console.error('Connection error:', connErr);
          throw new Error(`Connection failed: ${connErr instanceof Error ? connErr.message : String(connErr)}`);
        }
        
        if (!mounted) return;
        
        // Once connected, store the NDK instance
        setNDK(ndkInstance);
        setError(null);
        setIsRetrying(false);
        setShowUI(true);
        
        // Fetch MADTRIPS profile
        try {
          console.log('Fetching profile for:', CORE_NPUBS_OBJ.MADTRIPS);
          const madtripsUser = new NDKUser({ npub: CORE_NPUBS_OBJ.MADTRIPS });
          
          await Promise.race([
            madtripsUser.fetchProfile(),
            new Promise(resolve => setTimeout(resolve, 5000))
          ]);
          
          if (madtripsUser.profile) {
            console.log('Profile fetched successfully:', madtripsUser.profile);
            setProfile(madtripsUser.profile);
          }
        } catch (err) {
          console.error('Error fetching madtrips profile:', err);
        }
      } catch (error) {
        console.error('Error initializing NDK:', error);
        
        if (!mounted) return;
        
        setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying NDK initialization (${retryCount}/${maxRetries})...`);
          
          setIsRetrying(true);
          setTimeout(() => {
            if (mounted) initNDK();
          }, retryDelay * retryCount); // Increasing delay for each retry
        } else {
          // Always show UI even if connection fails
          setShowUI(true);
        }
      }
    };
    
    // Only try to initialize on client-side
    if (typeof window !== 'undefined') {
      initNDK();
    }
    
    // Cleanup on unmount
    return () => {
      clearTimeout(forceUITimer);
      mounted = false;
      console.log('Cleaning up NDK initialization...');
    };
  }, []);
  
  // Show only loading state while attempting connection, but force UI after timeout
  if (!showUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <h1 className="text-6xl font-bold text-blue-600 mb-8 text-center">
          <span className="block">MAD</span>
          <span className="block">FUN</span>
        </h1>
        
        <div className="text-xl text-blue-600 mb-4 text-center">
          <div className="flex flex-col items-center">
            <p>{isRetrying ? 'Retrying connection...' : 'Connecting to Nostr network...'}</p>
            <div className="mt-4 w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main UI - always show after timeout or successful connection
  return (
    <ErrorBoundary>
      {ndk ? (
        <WOTProvider ndk={ndk}>
          <MainUI profile={profile} />
        </WOTProvider>
      ) : (
        // Fallback UI when NDK fails to initialize but we still want to show something
        <MainUI profile={null} isOfflineMode={true} />
      )}
    </ErrorBoundary>
  );
};

// Separate component for the main UI to avoid repetition
const MainUI: React.FC<{profile: any, isOfflineMode?: boolean}> = ({ profile, isOfflineMode = false }) => {
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-8">
        {isOfflineMode && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md mb-4 text-center">
            ⚠️ Limited functionality - Some features may not work properly
          </div>
        )}
      
        <header className="mb-8 relative flex items-center justify-between">
          {/* Profile section at left */}
          <div className="flex-shrink-0">
            {profile ? (
              <div className="flex items-center">
                <img 
                  src={profile.picture || '/assets/nostrloginicon.gif'} 
                  alt="Madtrips" 
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div className="text-left">
                  <div className="font-semibold">madtrips</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Explore Madeira with nostr!</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <img 
                  src="/assets/nostrloginicon.gif" 
                  alt="Madtrips"
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div className="text-left">
                  <div className="font-semibold">madtrips</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Explore Madeira with nostr!</div>
                </div>
              </div>
            )}
          </div>
          
          {/* App title - centered, two lines */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <div className="flex flex-col">
              <span className="text-6xl font-bold text-blue-600 leading-none">MAD</span>
              <span className="text-6xl font-bold text-blue-600 leading-none">FUN</span>
            </div>
          </div>
          
          {/* Empty div for flex balance */}
          <div className="flex-shrink-0 w-12"></div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {ENABLE_FEATURES.BILLBOARD ? (
            <ErrorBoundary>
              <Billboard />
            </ErrorBoundary>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-bold mb-4">Billboard Placeholder</h2>
              <p>Billboard component is disabled</p>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">About MadFun</h2>
            <p className="mb-4">
              MadFun is a decentralized social exploration app for Madeira Island enthusiasts, 
              built on the Nostr protocol. Connect with other Madeira lovers, discover beautiful 
              places, and share your experiences.
            </p>
            <div className="flex flex-wrap gap-2">
              {MADEIRA_HASHTAGS.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {ENABLE_FEATURES.SOCIAL_GRAPH ? (
          <div className="mb-8">
            <ErrorBoundary>
              <SocialGraph />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Social Graph Placeholder</h2>
            <p>Social Graph component is disabled</p>
          </div>
        )}
        
        {ENABLE_FEATURES.SOCIAL_FEED ? (
          <div className="mb-8">
            <ErrorBoundary>
              <SocialFeed />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Social Feed Placeholder</h2>
            <p>Social Feed component is disabled</p>
          </div>
        )}

        {ENABLE_FEATURES.LOGIN_BUTTON ? (
          <ErrorBoundary>
            <NostrLoginButton />
          </ErrorBoundary>
        ) : (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Login Button Placeholder</h2>
            <p>Login Button component is disabled</p>
          </div>
        )}
      </div>
    </>
  );
};

export default App; 
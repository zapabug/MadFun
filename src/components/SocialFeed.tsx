import React, { useEffect, useState } from 'react';
import { useNostr } from '../hooks/useNostr';
import { useWOT } from '../context/WOTContext';
import { Post } from '../types';
import { analyzeMadeiraConnections } from '../utils/mcp';
import { CORE_NPUBS_OBJ } from '../constants/nostr';

const SocialFeed: React.FC = () => {
  const { fetchPosts } = useNostr();
  const { wot, getTrustScore, isLoading, dataInitialized } = useWOT();
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  
  // Fetch posts from trusted network
  useEffect(() => {
    const getFeedContent = async () => {
      setFeedLoading(true);
      
      try {
        // Get trusted pubkeys (trust score > 0.3)
        const trustedPubkeys = Object.keys(wot.profiles)
          .filter(pubkey => getTrustScore(pubkey) > 0.3);
        
        if (trustedPubkeys.length === 0) {
          setFeedLoading(false);
          return;
        }
        
        // Fetch posts from trusted network
        const filter = {
          kinds: [1], // text notes
          authors: trustedPubkeys,
          limit: 50,
          since: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last week
        };
        
        const fetchedPosts = await fetchPosts(filter);
        
        // Sort by recency
        fetchedPosts.sort((a, b) => b.created_at - a.created_at);
        
        // Filter for posts with text
        const validPosts = fetchedPosts.filter(post => 
          post.content.trim().length > 0
        );
        
        setPosts(validPosts);
      } catch (error) {
        console.error('Error fetching feed posts:', error);
      } finally {
        setFeedLoading(false);
      }
    };
    
    // Only fetch posts when data is initialized and not loading
    if (Object.keys(wot.profiles).length > 0 && dataInitialized && !isLoading) {
      getFeedContent();
    }
  }, [wot.profiles, fetchPosts, getTrustScore, dataInitialized, isLoading]);
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get author profile
  const getAuthorProfile = (pubkey: string) => {
    return wot.profiles[pubkey] || null;
  };
  
  // Get default profile when no profile picture is available
  const getDefaultProfilePicture = () => {
    // Only use madtrips profile as fallback if something is faulty
    return "/assets/nostrloginicon.gif";
  };
  
  // Analyze if user should follow post author
  const handleAnalyzeConnection = async (pubkey: string) => {
    if (!wot.profiles[pubkey]) return;
    
    // Get the author's profile
    const authorProfile = wot.profiles[pubkey];
    
    // Get connected profiles
    const connectedPubkeys = Object.keys(wot.profiles);
    const connectedProfiles = connectedPubkeys
      .map(pk => wot.profiles[pk])
      .filter(profile => profile.pubkey !== pubkey);
    
    // Analyze connection
    const analysis = await analyzeMadeiraConnections(authorProfile, connectedProfiles);
    
    // For demo, just log the results
    console.log('Connection analysis:', analysis);
    alert(`Madeira relevance score: ${analysis.relevanceScore}/100\n` +
          `Madeira enthusiast: ${analysis.isMadeiraEnthusiast ? 'Yes' : 'No'}\n` +
          `Relevant hashtags: ${analysis.relevantHashtags.join(', ')}`);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-2">Madeira Community Feed</h2>
      
      {isLoading || feedLoading ? (
        <div className="flex items-center justify-center h-32 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-blue-600">Loading community posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center h-32 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400">No community posts found yet</div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              {/* Author row */}
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                  <img 
                    src={getAuthorProfile(post.pubkey)?.picture || getDefaultProfilePicture()} 
                    alt="Author"
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold">
                    {getAuthorProfile(post.pubkey)?.displayName || 
                     getAuthorProfile(post.pubkey)?.name || 
                     post.pubkey.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(post.created_at)}
                  </div>
                </div>
                
                {/* Analyze button */}
                <button 
                  onClick={() => handleAnalyzeConnection(post.pubkey)}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full"
                >
                  Analyze
                </button>
              </div>
              
              {/* Content */}
              <div className="mb-3 whitespace-pre-wrap break-words">
                {post.content}
              </div>
              
              {/* Images */}
              {post.imageUrls.length > 0 && (
                <div className="mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {post.imageUrls.slice(0, 4).map((url, index) => (
                      <div key={index} className="aspect-w-16 aspect-h-9">
                        <img 
                          src={url} 
                          alt={`Attached image ${index+1}`}
                          className="w-full h-48 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 text-sm text-blue-600">
                  {post.hashtags.map(tag => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialFeed; 
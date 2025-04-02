import React, { useEffect, useState } from 'react';
import { useNostr } from '../hooks/useNostr';
import { useWOT } from '../context/WOTContext';
import { Post } from '../types';
import { MADEIRA_HASHTAGS } from '../constants/nostr';

const Billboard: React.FC = () => {
  const { fetchMadeiraPosts } = useNostr();
  const { wot, isLoading, dataInitialized } = useWOT();
  const [posts, setPosts] = useState<Post[]>([]);
  const [billboardLoading, setBillboardLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch Madeira-related posts with images
  useEffect(() => {
    const getPosts = async () => {
      setBillboardLoading(true);
      try {
        // Only fetch posts once WOT data is initialized
        const fetchedPosts = await fetchMadeiraPosts();
        
        // Only keep posts with images
        const postsWithImages = fetchedPosts.filter(post => post.imageUrls.length > 0);
        
        // Sort by most recent
        postsWithImages.sort((a, b) => b.created_at - a.created_at);
        
        setPosts(postsWithImages);
      } catch (error) {
        console.error('Error fetching billboard posts:', error);
      } finally {
        setBillboardLoading(false);
      }
    };
    
    // Only fetch posts when data is initialized
    if (dataInitialized && !isLoading) {
      getPosts();
    }
    
    // Auto-rotate images every 10 seconds
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % Math.max(posts.length, 1));
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchMadeiraPosts, dataInitialized, isLoading]);
  
  // Navigate to next/prev post
  const nextPost = () => {
    setCurrentIndex(prev => (prev + 1) % posts.length);
  };
  
  const prevPost = () => {
    setCurrentIndex(prev => (prev - 1 + posts.length) % posts.length);
  };
  
  // Get author profile data for the current post
  const getAuthorProfile = (pubkey: string) => {
    return wot.profiles[pubkey] || null;
  };
  
  // Extract hashtags from the post
  const getRelevantHashtags = (post: Post) => {
    return post.hashtags
      .filter(tag => MADEIRA_HASHTAGS.includes(tag.toLowerCase()))
      .slice(0, 3); // Limit to 3 hashtags
  };

  // Get default profile when no profile picture is available
  const getDefaultProfilePicture = () => {
    // Only use madtrips profile as fallback if something is faulty
    return "/assets/nostrloginicon.gif";
  };

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <h2 className="text-xl font-bold p-4 bg-blue-600 text-white">Madeira Image Showcase</h2>
      
      {billboardLoading || isLoading ? (
        <div className="flex items-center justify-center h-64 bg-gray-200 dark:bg-gray-800">
          <div className="text-blue-600">Loading Madeira images...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-200 dark:bg-gray-800">
          <div className="text-gray-600 dark:text-gray-400">No Madeira images found</div>
        </div>
      ) : (
        <div className="relative">
          {/* Image */}
          <div className="aspect-w-16 aspect-h-9 w-full">
            {posts[currentIndex]?.imageUrls[0] && (
              <img 
                src={posts[currentIndex].imageUrls[0]} 
                alt="Madeira content"
                className="w-full h-64 object-cover"
              />
            )}
          </div>
          
          {/* Navigation buttons */}
          <button 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
            onClick={prevPost}
          >
            ←
          </button>
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
            onClick={nextPost}
          >
            →
          </button>
          
          {/* Author info bar */}
          <div className="p-3 bg-white dark:bg-gray-800 flex items-center">
            {posts[currentIndex] && (
              <>
                {/* Author profile pic */}
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                  <img 
                    src={getAuthorProfile(posts[currentIndex].pubkey)?.picture || getDefaultProfilePicture()} 
                    alt="Author"
                    className="h-full w-full object-cover"
                  />
                </div>
                
                {/* Author name and tags */}
                <div>
                  <div className="font-semibold">
                    {getAuthorProfile(posts[currentIndex].pubkey)?.displayName || 
                     getAuthorProfile(posts[currentIndex].pubkey)?.name || 
                     posts[currentIndex].pubkey.slice(0, 8)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex gap-1">
                    {getRelevantHashtags(posts[currentIndex]).map(tag => (
                      <span key={tag} className="text-blue-600">#{tag}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Billboard; 
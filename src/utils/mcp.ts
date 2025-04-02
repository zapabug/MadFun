import { NDKEvent } from '@nostr-dev-kit/ndk';
import { MCPMessage, ProfileData, Post } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MADEIRA_HASHTAGS } from '../constants/nostr';

// Constants for MCP
const MCP_PREFIX = "mcp:";
const MADFUN_MCP_AGENT = "madfun-mcp-agent";

// Helper function to generate MCP message IDs
function generateMCPId(): string {
  return `${MCP_PREFIX}${uuidv4()}`;
}

/**
 * Analyze a user's profile and connection patterns to determine relevance to Madeira community
 */
export async function analyzeMadeiraConnections(
  profile: ProfileData,
  connectedProfiles: ProfileData[]
): Promise<{
  isMadeiraEnthusiast: boolean;
  relevanceScore: number;
  relevantHashtags: string[];
  suggestedConnections: string[];
}> {
  // In a real implementation, this would communicate with an AI service
  // Here we'll implement a simplified version
  
  // Count Madeira-related content
  let madeiraReferences = 0;
  let relevantHashtags: string[] = [];
  
  // Check profile data for Madeira references
  const profileText = [
    profile.name || '',
    profile.displayName || '',
    profile.about || ''
  ].join(' ').toLowerCase();
  
  MADEIRA_HASHTAGS.forEach(tag => {
    if (profileText.includes(tag.toLowerCase())) {
      madeiraReferences++;
      if (!relevantHashtags.includes(tag)) {
        relevantHashtags.push(tag);
      }
    }
  });
  
  // Check connections for Madeira enthusiasts
  const madeiraConnections = connectedProfiles.filter(connectedProfile => {
    const connectedText = [
      connectedProfile.name || '',
      connectedProfile.displayName || '',
      connectedProfile.about || ''
    ].join(' ').toLowerCase();
    
    return MADEIRA_HASHTAGS.some(tag => 
      connectedText.includes(tag.toLowerCase())
    );
  });
  
  // Calculate relevance score (0-100)
  const relevanceScore = Math.min(
    100,
    (madeiraReferences * 15) + (madeiraConnections.length * 10)
  );
  
  // Suggest connections
  const suggestedConnections = madeiraConnections
    .filter(connection => !profile.following.includes(connection.pubkey))
    .map(connection => connection.pubkey)
    .slice(0, 5);
  
  return {
    isMadeiraEnthusiast: relevanceScore > 30,
    relevanceScore,
    relevantHashtags,
    suggestedConnections
  };
}

/**
 * Extract hashtags and image URLs from Nostr event
 */
export function processNostrEvent(event: NDKEvent): Post | null {
  if (!event || !event.content) return null;
  
  // Extract URLs from content
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = event.content.match(urlRegex) || [];
  
  // Filter for image URLs
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const imageUrls = urls.filter(url => 
    imageExtensions.some(ext => url.toLowerCase().includes(ext))
  );
  
  // Extract hashtags
  const hashtagRegex = /#(\w+)/g;
  let hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(event.content)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  
  // Check for Madeira hashtags or keywords in content and tags
  const isMadeiraRelated = 
    hashtags.some(tag => MADEIRA_HASHTAGS.includes(tag)) ||
    MADEIRA_HASHTAGS.some(tag => event.content.toLowerCase().includes(tag));
  
  // Also look for hashtags in event tags
  const tagHashtags = event.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1].toLowerCase());
  
  hashtags = [...new Set([...hashtags, ...tagHashtags])];
  
  // Create a Post object
  return {
    id: event.id || uuidv4(),
    pubkey: event.pubkey || '',
    content: event.content || '',
    created_at: event.created_at || Math.floor(Date.now() / 1000),
    tags: event.tags || [],
    imageUrls,
    hashtags,
    sig: event.sig || '',
    event
  };
}

/**
 * Create a new MCP message for external AI processing 
 */
export function createMCPMessage(
  type: 'query',
  content: any,
  metadata?: Record<string, any>
): MCPMessage {
  return {
    type,
    id: generateMCPId(),
    content,
    metadata: {
      agent: MADFUN_MCP_AGENT,
      timestamp: Date.now(),
      ...metadata
    }
  };
} 
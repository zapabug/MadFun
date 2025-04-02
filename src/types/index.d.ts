import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';

// Declare modules to fix import issues
declare module 'react-force-graph';

// For the Web of Trust
export interface ProfileData {
  pubkey: string;
  name?: string;
  displayName?: string;
  picture?: string;
  about?: string;
  metadata?: Record<string, any>;
  followers: string[];
  following: string[];
  trustScore?: number;
}

export interface WOTState {
  profiles: Record<string, ProfileData>;
  seedUsers: string[];
  loading: boolean;
  error: string | null;
}

// For Posts
export interface Post {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  tags: string[][];
  imageUrls: string[];
  hashtags: string[];
  sig?: string;
  event?: NDKEvent;
}

// For MCP
export interface MCPMessage {
  type: 'query' | 'response' | 'error';
  id: string;
  content: any;
  metadata?: Record<string, any>;
}

// Social Graph Node/Link types
export interface GraphNode {
  id: string;
  name: string;
  val: number;
  img?: string;
  trustScore?: number;
  x?: number;
  y?: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
} 
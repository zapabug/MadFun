import { NDKRelay } from '@nostr-dev-kit/ndk';

// Core npubs with named access
export const CORE_NPUBS_OBJ = {
  MADTRIPS: "npub1dxd02kcjhgpkyrx60qnkd6j42kmc72u5lum0rp2ud8x5zfhnk4zscjj6hh",
  FUNCHAL: "npub1funchalx8v747rsee6ahsuyrcd2s3rnxlyrtumfex9lecpmgwars6hq8kc",
  COMMUNITY: "npub1etgqcj9gc6yaxttuwu9eqgs3ynt2dzaudvwnrssrn2zdt2useaasfj8n6e",
  SEC: "npub1s0veng2gvfwr62acrxhnqexq76sj6ldg3a5t935jy8e6w3shr5vsnwrmq5"
};

// Array format for easier iteration in components like SocialGraph
export const CORE_NPUBS = [
  "npub1dxd02kcjhgpkyrx60qnkd6j42kmc72u5lum0rp2ud8x5zfhnk4zscjj6hh", // MADTRIPS
  "npub1funchalx8v747rsee6ahsuyrcd2s3rnxlyrtumfex9lecpmgwars6hq8kc", // FUNCHAL  
  "npub1etgqcj9gc6yaxttuwu9eqgs3ynt2dzaudvwnrssrn2zdt2useaasfj8n6e", // COMMUNITY
  "npub1s0veng2gvfwr62acrxhnqexq76sj6ldg3a5t935jy8e6w3shr5vsnwrmq5"  // SEC
];

// Hashtags relevant to Madeira
export const MADEIRA_HASHTAGS = [
  "madeira", 
  "madeiraisland", 
  "funchal", 
  "portugal", 
  "travel", 
  "hiking", 
  "nature", 
  "ocean"
];

// Well-known, highly-reliable relays first
export const RELAYS = {
  // Use most reliable, fast, globally accessed relays
  PRIMARY: [
    "wss://relay.damus.io",
    "wss://nos.lol", 
    "wss://relay.nostr.band",
    "wss://relay.snort.social",
    "wss://nostr.mutinywallet.com",
    "wss://relay.nostr.info",
    "wss://purplepag.es"
  ],
  
  // Popular general purpose relays with good uptime
  COMMUNITY: [
    "wss://relay.snort.social",
    "wss://eden.nostr.land",
    "wss://relay.nostr.info",
    "wss://relay.current.fyi",
    "wss://purplepag.es"
  ],
  
  // Backup relays if others fail
  BACKUP: [
    "wss://nostr.mutinywallet.com",
    "wss://nostr-pub.wellorder.net",
    "wss://relay.nostr.bg",
    "wss://nostr.zebedee.cloud",
    "wss://relay.primal.net",
  ]
};

// Default list of relays to use - most reliable ones for development
export const DEFAULT_RELAYS = [
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://nostr.mutinywallet.com",
  "wss://relay.nostr.band"
];

// Function to get a specific set of relays
export const getRelays = (type: keyof typeof RELAYS | 'DEFAULT') => {
  if (type === 'DEFAULT') return DEFAULT_RELAYS;
  return RELAYS[type];
};

// Function to get all available relays
export const getAllRelays = () => {
  return [
    ...RELAYS.PRIMARY,
    ...RELAYS.COMMUNITY,
    ...RELAYS.BACKUP,
  ];
};

// Helper function to create an NDKRelay from a URL string
export const createRelay = (url: string): NDKRelay => {
  return { url } as NDKRelay;
};

// Function to create an array of NDKRelay objects from a list of URLs
export const createRelays = (urls: string[]): NDKRelay[] => {
  return urls.map(url => createRelay(url));
}; 
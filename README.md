# MadFun - Discover Madeira through Nostr

A decentralized social exploration app for Madeira Island enthusiasts, built on the Nostr protocol.

## Features

- **Social Graph** - Visualize connections between Madeira enthusiasts
- **Image Billboard** - See beautiful images of Madeira shared on Nostr
- **Community Feed** - Read posts from trusted Nostr users about Madeira
- **AI-Powered Analysis** - Uses MCP to provide intelligent insights about social connections

## Tech Stack

- **Bun** - Fast JavaScript runtime and package manager
- **Vite** - Next Generation Frontend Tooling
- **React** - UI Library
- **Tailwind CSS** - Utility-first CSS framework
- **NDK (Nostr Dev Kit)** - SDK for interacting with the Nostr protocol
- **MCP (Model Context Protocol)** - For AI-assisted interactions

## App Layout

The application follows a modern React architecture:

```
madfun/
├── public/               # Static assets and favicon
├── src/
│   ├── assets/           # Image assets and static resources
│   ├── components/       # React components
│   │   ├── Billboard.tsx # Image carousel component
│   │   ├── Header.tsx    # Application header
│   │   ├── SocialFeed.tsx # Community posts display
│   │   ├── SocialGraph.tsx # Network visualization
│   │   └── ...
│   ├── context/         
│   │   └── WOTContext.tsx # Web of Trust state management
│   ├── hooks/            # Custom React hooks
│   │   └── useNostr.ts   # Nostr protocol interactions
│   ├── services/         # External service integration
│   │   └── relayPool.ts  # Nostr relay connection management
│   ├── styles/           # Global styles and Tailwind config
│   ├── utils/
│   │   └── mcp.ts        # AI processing utilities
│   ├── constants/        
│   │   └── nostr.ts      # Nostr-related constants
│   ├── App.tsx           # Main application container
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # TypeScript declarations
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## Component Structure

- `App.tsx` - Main container that initializes NDK and renders all components
- `context/WOTContext.tsx` - Provides Web of Trust state management
- `components/Billboard.tsx` - Displays image carousel with author info
- `components/SocialGraph.tsx` - Renders interactive force-directed graph visualization
- `components/SocialFeed.tsx` - Shows community posts with text and images
- `components/login/NostrLoginButton.tsx` - Enables user authentication via nostr-login
- `utils/mcp.ts` - Handles AI processing of Nostr events
- `constants/nostr.ts` - Central location for all Nostr-related constants

## Configuration

The app is configured with:

- **Core Nostr Users**: Specific npubs that serve as seed users for the social graph
- **Relay Categories**: Different sets of relays optimized for various purposes
  - Primary: Essential relays for core functionality
  - Community: Relays focused on community content
  - Fast: Optimized for quick responses
  - Backup: Used when primary relays fail
- **Madeira Hashtags**: Specific hashtags related to Madeira island
- **TypeScript Configuration**: Custom setup for React components with module paths and type declarations

## Dependency Management

The application uses specific versions of dependencies to ensure compatibility:

- **NDK (Nostr Dev Kit)** - Version 2.x with matching nostr-tools 2.x
- **nostr-login** - For authentication via external Nostr signers
- **React 18** - For modern React features
- **React Force Graph** - For visualizing the social network
- **PostCSS/Tailwind** - For styling with utility classes

## TypeScript Configuration

The project uses TypeScript with the following configuration:

- **Module System**: ESNext with bundler module resolution
- **Type Definitions**: Uses @nostr-dev-kit/ndk types for Nostr protocol interactions
- **Path Aliases**: Custom path mapping for easier imports
- **Linting Settings**: Configured for React development with appropriate strictness
- **Dependency Management**: Relies on direct dependencies for NDK and nostr-login, which internally handle their own sub-dependencies

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/madfun.git
   cd madfun
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Start the development server:
   ```
   bun run dev
   ```

4. Build for production:
   ```
   bun run build
   ```

## Madeira Hashtags

The app focuses on these Madeira-related hashtags:
- #madeira
- #travelmadeira
- #visitmadeira
- #funchal
- #fanal
- #espetada
- #freemadeira
- #madstr

## Web of Trust (WOT)

The app builds a social graph starting with 4 core Nostr users (npubs) who are Madeira enthusiasts, and then explores their connections to build a Web of Trust. This approach helps discover relevant content and people in the Madeira community.

## Relay Management

The application connects to different Nostr relays categorized by their purpose:
- Primary relays for essential functionality
- Community relays for social content
- Fast relays for real-time interactions
- Backup relays for redundancy

## Deployment

The build process creates static files that can be deployed anywhere including:
- GitHub Pages
- nSite (Nostr-powered hosting)
- Any static file hosting service

## License

MIT 
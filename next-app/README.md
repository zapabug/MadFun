# MadTrips - Nostr Travel App

A decentralized travel application built on the Nostr protocol. MadTrips allows users to share their travel experiences, discover new places, and connect with travelers around the world.

## Features

- Connect to the Nostr network to share and discover trips
- User authentication via NIP-07 browser extensions or private keys
- Lightning Network integration for payments and tips
- Interactive maps and visualizations using D3.js
- Responsive design with Tailwind CSS

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **CSS**: Tailwind CSS
- **Nostr**: NDK (Nostr Development Kit)
- **Visualization**: D3.js
- **State Management**: React Context API
- **Lightning Network**: WebLN and LNBits

## Project Structure

```
/src
  /app           - Next.js App Router pages
  /components    - Reusable UI components
  /contexts      - React Context providers
  /hooks         - Custom React hooks
  /services      - API and Nostr services
  /styles        - Global styles and Tailwind config
  /types         - TypeScript interfaces and types
  /utils         - Helper functions and utilities
```

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/madtrips-nostr-client.git
   cd madtrips-nostr-client
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm run start`
- **Run linter**: `npm run lint`

## Nostr Integration

MadTrips uses the following Nostr features:

- Custom event kinds for trip data (30078-30081)
- NIP-07 for browser extension authentication
- NIP-05 for user verification
- Lightning Network integration via NIP-57

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
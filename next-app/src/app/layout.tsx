import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { NostrProvider } from '@/contexts/NostrContext';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MadTrips - Nostr Travel App',
  description: 'A Nostr-based application for travel enthusiasts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default relays
  const defaultRelays = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://relay.snort.social',
  ];

  return (
    <html lang="en">
      <body className={inter.className}>
        <NostrProvider initialRelays={defaultRelays}>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white dark:bg-foreground shadow-inner py-6">
              <div className="container-main text-center text-sm text-gray-500">
                <p>MadTrips - A Nostr-powered Travel App © {new Date().getFullYear()}</p>
              </div>
            </footer>
          </div>
        </NostrProvider>
      </body>
    </html>
  );
}
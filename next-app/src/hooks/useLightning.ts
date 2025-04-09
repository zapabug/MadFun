import { useState, useCallback } from 'react';
import { requestProvider, WebLNProvider } from 'webln';

interface LightningHookResult {
  isWebLNAvailable: boolean;
  isConnected: boolean;
  provider: WebLNProvider | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  makePayment: (invoice: string) => Promise<{ preimage: string } | null>;
  generateInvoice: (amount: number, memo: string) => Promise<string | null>;
  error: string | null;
}

/**
 * Custom hook for interacting with Lightning Network via WebLN
 */
export const useLightning = (): LightningHookResult => {
  const [provider, setProvider] = useState<WebLNProvider | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isWebLNAvailable, setIsWebLNAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if WebLN is available and try to connect
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const webln = await requestProvider();
      setProvider(webln);
      setIsConnected(true);
      setIsWebLNAvailable(true);
      return true;
    } catch (e) {
      console.error('Failed to connect to WebLN provider:', e);
      setIsWebLNAvailable(typeof window !== 'undefined' && 'webln' in window);
      setError('Could not connect to a Lightning wallet. Please make sure you have a compatible browser extension installed.');
      return false;
    }
  }, []);

  // Disconnect from the WebLN provider
  const disconnect = useCallback(() => {
    setProvider(null);
    setIsConnected(false);
  }, []);

  // Make a payment using a BOLT11 invoice
  const makePayment = useCallback(async (invoice: string): Promise<{ preimage: string } | null> => {
    if (!provider) {
      setError('Lightning provider not connected');
      return null;
    }

    try {
      setError(null);
      const result = await provider.sendPayment(invoice);
      return { preimage: result.preimage };
    } catch (e) {
      console.error('Lightning payment failed:', e);
      setError('Payment failed. Please try again.');
      return null;
    }
  }, [provider]);

  // Generate a BOLT11 invoice
  const generateInvoice = useCallback(async (amount: number, memo: string): Promise<string | null> => {
    if (!provider) {
      setError('Lightning provider not connected');
      return null;
    }

    try {
      setError(null);
      const invoice = await provider.makeInvoice({
        amount: Math.round(amount), // Convert to sats
        defaultMemo: memo,
      });
      
      return invoice.paymentRequest;
    } catch (e) {
      console.error('Failed to generate invoice:', e);
      setError('Could not generate invoice. Please try again.');
      return null;
    }
  }, [provider]);

  return {
    isWebLNAvailable,
    isConnected,
    provider,
    connect,
    disconnect,
    makePayment,
    generateInvoice,
    error,
  };
};

export default useLightning;
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getOffers, getOffer, createOffer, updateOfferStatus, sendOfferToCustomer } from '../services/offerService';
import { Offer, OfferStatus } from '../types';

interface OfferContextType {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  fetchOffers: () => Promise<void>;
  fetchOffer: (offerId: string) => Promise<Offer | null>;
  createOfferFromReport: (reportId: string, offerData: any) => Promise<string>;
  updateStatus: (offerId: string, status: OfferStatus, reason?: string) => Promise<void>;
  sendOffer: (offerId: string) => Promise<void>;
  refreshOffers: () => Promise<void>;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

interface OfferProviderProps {
  children: ReactNode;
}

export const OfferProvider: React.FC<OfferProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!currentUser) {
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedOffers = await getOffers(currentUser);
      setOffers(fetchedOffers);
    } catch (err: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error fetching offers:', err);
      setError('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchOffer = useCallback(async (offerId: string): Promise<Offer | null> => {
    try {
      const offer = await getOffer(offerId);
      if (offer) {
        // Update the offer in the list if it exists
        setOffers((prevOffers) =>
          prevOffers.map((o) => (o.id === offerId ? offer : o))
        );
      }
      return offer;
    } catch (err: any) {
      const { logger } = await import('../utils/logger');
      logger.error('Error fetching offer:', err);
      setError('Failed to fetch offer');
      return null;
    }
  }, []);

  const createOfferFromReport = useCallback(
    async (reportId: string, offerData: any): Promise<string> => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        const offerId = await createOffer(reportId, {
          ...offerData,
          createdBy: currentUser.uid,
          createdByName: currentUser.displayName || currentUser.email || '',
        });
        // Refresh offers list
        await fetchOffers();
        return offerId;
      } catch (err: any) {
        const { logger } = await import('../utils/logger');
        logger.error('Error creating offer:', err);
        throw err;
      }
    },
    [currentUser, fetchOffers]
  );

  const updateStatus = useCallback(
    async (offerId: string, status: OfferStatus, reason?: string): Promise<void> => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        await updateOfferStatus(
          offerId,
          status,
          currentUser.uid,
          currentUser.displayName || currentUser.email || '',
          reason
        );
        // Refresh offers list
        await fetchOffers();
      } catch (err: any) {
        const { logger } = await import('../utils/logger');
        logger.error('Error updating offer status:', err);
        throw err;
      }
    },
    [currentUser, fetchOffers]
  );

  const sendOffer = useCallback(
    async (offerId: string): Promise<void> => {
      try {
        await sendOfferToCustomer(offerId);
        // Refresh offers list
        await fetchOffers();
      } catch (err: any) {
        const { logger } = await import('../utils/logger');
        logger.error('Error sending offer:', err);
        throw err;
      }
    },
    [fetchOffers]
  );

  const refreshOffers = useCallback(async () => {
    await fetchOffers();
  }, [fetchOffers]);

  // Fetch offers when user changes
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const value: OfferContextType = {
    offers,
    loading,
    error,
    fetchOffers,
    fetchOffer,
    createOfferFromReport,
    updateStatus,
    sendOffer,
    refreshOffers,
  };

  return <OfferContext.Provider value={value}>{children}</OfferContext.Provider>;
};

export const useOffers = (): OfferContextType => {
  const context = useContext(OfferContext);
  if (context === undefined) {
    throw new Error('useOffers must be used within an OfferProvider');
  }
  return context;
};


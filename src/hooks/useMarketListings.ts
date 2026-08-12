import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

export interface MarketListing {
  id?: string;
  crop: string;
  quantity: number; // in quintals
  price: number; // per quintal
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  createdAt?: any;
}

export function useMarketListings() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'market_listings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: MarketListing[] = [];
        snapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as MarketListing);
        });
        setListings(results);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching market listings:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addListing = async (listingData: Omit<MarketListing, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'market_listings'), {
        ...listingData,
        createdAt: serverTimestamp(),
      });
      setLoading(false);
      return docRef.id;
    } catch (err: any) {
      console.error("Error adding listing: ", err);
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  const getUserListings = async (userId: string) => {
     try {
       // Since we might not want to create a composite index immediately,
       // we can either query by author or filter client-side for now
       // for simplicity filtering client side among all lists is not ideal but works
       // To do properly: const q = query(collection(db, 'market_listings'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
       return listings.filter((l) => l.userId === userId);
     } catch (err) {
       console.error("Error formatting user listings:", err);
       return [];
     }
  }

  return { listings, loading, error, addListing, getUserListings };
}

import { useState, useCallback } from 'react';
import { Product } from '@/types/product';
import { lookupProduct, ProductNotFoundError } from '@/services/open-food-facts';

interface UseProductLookup {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  lookup: (barcode: string) => Promise<Product | null>;
  reset: () => void;
}

export function useProductLookup(): UseProductLookup {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useCallback(async (barcode: string): Promise<Product | null> => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setProduct(null);

    try {
      const result = await lookupProduct(barcode);
      setProduct(result);
      return result;
    } catch (err) {
      if (err instanceof ProductNotFoundError) {
        setNotFound(true);
        // Return a basic product with just the barcode
        const unknownProduct: Product = {
          barcode,
          name: 'Unknown Product',
        };
        setProduct(unknownProduct);
        return unknownProduct;
      }
      setError(err instanceof Error ? err.message : 'Failed to look up product');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProduct(null);
    setIsLoading(false);
    setError(null);
    setNotFound(false);
  }, []);

  return {
    product,
    isLoading,
    error,
    notFound,
    lookup,
    reset,
  };
}

import { Product, OpenFoodFactsProduct } from '@/types/product';

const BASE_URL = 'https://world.openfoodfacts.org/api/v0';

export class ProductNotFoundError extends Error {
  constructor(barcode: string) {
    super(`Product not found for barcode: ${barcode}`);
    this.name = 'ProductNotFoundError';
  }
}

export async function lookupProduct(barcode: string): Promise<Product> {
  const response = await fetch(`${BASE_URL}/product/${barcode}.json`, {
    headers: {
      'User-Agent': 'ScanToSky/1.0 (Expo React Native)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  const data: OpenFoodFactsProduct = await response.json();

  if (data.status !== 1 || !data.product) {
    throw new ProductNotFoundError(barcode);
  }

  const { product } = data;

  return {
    barcode,
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || undefined,
    imageUrl: product.image_front_url || product.image_url || undefined,
    quantity: product.quantity || undefined,
    categories: product.categories_tags || undefined,
  };
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
  categories?: string[];
}

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    quantity?: string;
    categories_tags?: string[];
  };
  status: number;
  status_verbose: string;
}

export interface ScanHistoryItem {
  id: string;
  product: Product;
  scannedAt: string;
  addedToList?: string;
}

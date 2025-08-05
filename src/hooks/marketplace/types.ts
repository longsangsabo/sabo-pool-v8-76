export interface MarketplaceItem {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string | null;
  condition: string | null;
  price: number;
  original_price?: number | null;
  brand?: string | null;
  model?: string | null;
  specifications?: any;
  images: string[] | null;
  location: string | null;
  status: string;
  views_count: number | null;
  favorites_count: number | null;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    club_id: string | null;
    province_id: string | null;
    provinces?: {
      name: string;
      region: string | null;
    } | null;
    total_items?: number;
    avg_response_time?: number;
  } | null;
  marketplace_reviews?: {
    rating: number;
    review_text: string | null;
  }[];
  shipping_available?: boolean;
}

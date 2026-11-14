export interface Item {
  id: string;
  lat: number;
  lng: number;
  description: string | null;
  photo_url: string | null;
  photo_path: string | null;
  location_note: string | null;
  address: string | null;
  created_at: string;
}

export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

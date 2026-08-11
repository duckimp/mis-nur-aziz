export interface Teacher {
  id: string;
  name: string;
  role: string;
  image_url?: string;
  order_index?: number;
  created_at?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  file_url: string;
  file_size: string;
  is_active: boolean;
  created_at?: string;
}

export interface Template {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  source_product_id: string;
  template_data: any; // JSONB data containing the template fields
  fields_to_copy: string[]; // Array of field names to copy
  is_favorite: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateData {
  user_id: number;
  name: string;
  description?: string;
  source_product_id: string;
  template_data: any;
  fields_to_copy: string[];
  is_favorite?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  template_data?: any;
  fields_to_copy?: string[];
  is_favorite?: boolean;
}

// Available fields that can be copied from a template
export const COPYABLE_FIELDS = [
  'price',
  'discount_price',
  'stock',
  'status',
  'category',
  'tags',
  'description',
  'specifications',
  'variants',
  'images',
  'weight',
  'dimensions',
  'brand',
  'warranty',
  'shipping_info'
] as const;

export type CopyableField = typeof COPYABLE_FIELDS[number];

// Field display names in Persian
export const FIELD_DISPLAY_NAMES: Record<CopyableField, string> = {
  price: 'قیمت',
  discount_price: 'قیمت تخفیف‌خورده',
  stock: 'موجودی',
  status: 'وضعیت',
  category: 'دسته‌بندی',
  tags: 'برچسب‌ها',
  description: 'توضیحات',
  specifications: 'مشخصات فنی',
  variants: 'تنوع‌ها',
  images: 'تصاویر',
  weight: 'وزن',
  dimensions: 'ابعاد',
  brand: 'برند',
  warranty: 'گارانتی',
  shipping_info: 'اطلاعات ارسال'
};
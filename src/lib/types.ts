export type Category = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  cta: string;
  image: string | null;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export type Product = {
  id: string;
  slug: string;
  category: string;
  name: string;
  nameEn: string;
  meta: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  badgeType: "new" | "sale" | null;
  sku: string;
  stock: number;
  image: string;
  images: string[];
  description: string;
  specs: Record<string, string>;
  sizes?: string[];
  careInstructions?: string;
};

export type CartItem = {
  key: string; // unique per id+size combo
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string | null;
  qty: number;
};

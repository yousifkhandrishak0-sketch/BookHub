export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'COD' | 'Bank Transfer';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  bookCount?: number;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  categorySlug: string;
  categoryName: string;
  publisher: string;
  isbn: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  coverImage: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  pages?: number;
  publishedYear?: number;
  isDemoInventory?: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  bookTitle?: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  wishlist: string[];
  createdAt: string;
}

export interface CartItem {
  bookId: string;
  quantity: number;
  book?: Book;
}

export interface OrderItem {
  bookId: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  email: string;
  paymentMethod: PaymentMethod;
  paymentNote?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  receiptToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverview {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  recentOrders: Order[];
}

export interface AdminStatusResponse {
  mode: 'env' | 'claimed' | 'unclaimed';
  configured: boolean;
}

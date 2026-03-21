export type UserRole = 'ADMIN' | 'TECHNICIAN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PaymentMethod = 'VOUCHER' | 'COD';
export type ProductCategory = 'Sensors' | 'ICs' | 'Passives' | 'Connectors' | 'Power' | 'Displays';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  voucherUrl?: string;
  createdAt: string;
}

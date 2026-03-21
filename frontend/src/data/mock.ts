import { User, Product, Order } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@sparx.com', role: 'ADMIN', status: 'APPROVED', createdAt: '2024-01-15' },
  { id: '2', name: 'Ahmed Hassan', email: 'ahmed@tech.com', role: 'TECHNICIAN', status: 'APPROVED', createdAt: '2024-02-10' },
  { id: '3', name: 'Sara Ali', email: 'sara@tech.com', role: 'TECHNICIAN', status: 'PENDING', createdAt: '2024-03-01' },
  { id: '4', name: 'Omar Khalil', email: 'omar@tech.com', role: 'TECHNICIAN', status: 'PENDING', createdAt: '2024-03-05' },
  { id: '5', name: 'Layla Mohamed', email: 'layla@tech.com', role: 'TECHNICIAN', status: 'REJECTED', createdAt: '2024-02-20' },
];



export const mockOrders: Order[] = [
  {
    id: 'ORD-001', userId: '2', userName: 'Ahmed Hassan',
    items: [
      { productId: 'p1', productName: 'DHT22 Temperature & Humidity Sensor', sku: 'SEN-DHT22-001', quantity: 5, unitPrice: 12.50 },
      { productId: 'p4', productName: 'ESP32-WROOM-32 Module', sku: 'IC-ESP32-004', quantity: 3, unitPrice: 8.90 },
    ],
    total: 89.20, status: 'PENDING', paymentMethod: 'VOUCHER', paymentStatus: 'PENDING', voucherUrl: '/placeholder.svg', createdAt: '2024-03-10',
  },
  {
    id: 'ORD-002', userId: '2', userName: 'Ahmed Hassan',
    items: [
      { productId: 'p5', productName: '10kΩ Resistor Pack (100pcs)', sku: 'PAS-RES-005', quantity: 2, unitPrice: 2.10 },
    ],
    total: 4.20, status: 'CONFIRMED', paymentMethod: 'COD', paymentStatus: 'VERIFIED', createdAt: '2024-03-08',
  },
  {
    id: 'ORD-003', userId: '3', userName: 'Sara Ali',
    items: [
      { productId: 'p11', productName: '0.96" OLED Display (I2C)', sku: 'DIS-OLED-011', quantity: 10, unitPrice: 6.50 },
    ],
    total: 65.00, status: 'PENDING', paymentMethod: 'VOUCHER', paymentStatus: 'PENDING', voucherUrl: '/placeholder.svg', createdAt: '2024-03-12',
  },
];

export const MOCK_CREDENTIALS = {
  admin: { email: 'admin@sparx.com', password: 'admin123' },
  technician: { email: 'ahmed@tech.com', password: 'tech123' },
};

import { getProducts } from '@/api/products';
import { StatusBadge, getStockVariant, getStockLabel } from '@/components/StatusBadge';
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';

import { useEffect, useState } from 'react';

interface Product {
  id: string;
  stock: number;
  minStock: number;
  sku: string;
  name: string;
}

interface Order {
  userId: string;
}

const TechDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const mockOrders: Order[] = []; // Define mockOrders with the appropriate type

  useEffect(() => {
    const fetchProducts = async () => {
      const productData = await getProducts();
      setProducts(productData);
    };
    fetchProducts();
  }, []);

  const lowStockItems = products.filter((p: Product) => p.stock <= p.minStock && p.stock > 0);
  const outOfStockItems = products.filter((p: Product) => p.stock === 0);
  const userOrders = mockOrders.filter((o: Order) => o.userId === '2');

  const stats = [
    { label: 'Total Products', value: getProducts.length, icon: Package },
    { label: 'Low Stock Alerts', value: lowStockItems.length, icon: AlertTriangle },
    { label: 'Out of Stock', value: outOfStockItems.length, icon: ShoppingCart },
    { label: 'My Orders', value: userOrders.length, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold font-mono-data text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-card shadow-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Quick Stock — Low Inventory Alerts</h2>
        </div>
        {lowStockItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">All items are well stocked.</div>
        ) : (
          <div className="divide-y divide-border">
            {lowStockItems.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-mono-data text-xs text-muted-foreground">{p.sku}</span>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-data text-sm text-foreground">{p.stock} left</span>
                  <StatusBadge label={getStockLabel(p.stock, p.minStock)} variant={getStockVariant(p.stock, p.minStock)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechDashboard;

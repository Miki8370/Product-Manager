import { Package, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { getOrders } from '@/api/orders';
import { getProducts } from '@/api/products';
import { getUsers } from '@/api/users';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  stock: number;
  minStock: number;
  name: string;
}

interface Order {
  id: number;
  payment_status: string;
  status: string;
  user_name?: string;
  total_amount: number;
  order_date: string;
}

interface User {
  id: number;
  is_approved: boolean;
  name: string;
  email: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, ordersData, usersData] = await Promise.all([
          getProducts(),
          getOrders(),
          getUsers()
        ]);
        setProducts(productsData);
        setOrders(ordersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingUsers = users.filter(u => !u.is_approved).length;
  const pendingPayments = orders.filter(o => o.payment_status === 'pending').length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalProducts = products.length;

  const stats = [
    { label: 'Total Products', value: totalProducts, icon: Package },
    { label: 'Pending Users', value: pendingUsers, icon: Users },
    { label: 'Pending Payments', value: pendingPayments, icon: CreditCard },
    { label: 'Low Stock Items', value: lowStockCount, icon: AlertTriangle },
  ];

  const recentOrders = orders.slice(0, 5);
  const pendingUsersList = users.filter(u => !u.is_approved).slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        <div className="rounded-lg bg-card shadow-card p-8 text-center text-muted-foreground">
          Loading dashboard data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Recent Orders</h2>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No orders yet
              </div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-mono-data font-medium text-foreground">#{order.id}</span>
                    <p className="text-xs text-muted-foreground">{order.user_name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.order_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-data">${order.total_amount?.toFixed(2) || '0.00'}</span>
                    <p className="text-xs text-muted-foreground">{order.status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Pending User Approvals</h2>
          </div>
          <div className="divide-y divide-border">
            {pendingUsersList.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No pending approvals
              </div>
            ) : (
              pendingUsersList.map(user => (
                <div key={user.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from 'react';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/StatusBadge';
import { apiClient } from '@/api/client';

interface Order {
  id: number;
  order_date: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  item_count: number;
}

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/order/');
      setOrders(response);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">My Orders</h1>
        <div className="rounded-lg bg-card p-8 text-center text-muted-foreground">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Payment</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map(order => (
                <tr key={order.id} className="h-12">
                  <td className="px-4 py-2 font-mono-data font-medium text-foreground">#{order.id}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(order.order_date)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{order.item_count} item(s)</td>
                  <td className="px-4 py-2 text-right font-mono-data font-medium">${order.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge label={getStatusLabel(order.status)} variant={getOrderStatusVariant(order.status)} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge 
                      label={order.payment_status?.toUpperCase() || 'PENDING'} 
                      variant={getPaymentStatusVariant(order.payment_status || 'PENDING')} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
import { useState, useEffect } from 'react';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, RefreshCw, Package, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiClient } from '@/api/client';

interface Order {
  id: number;
  order_date: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  item_count: number;
  user_name?: string;
}

interface OrderDetail {
  id: number;
  order_date: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment: {
    id: number;
    status: string;
    voucher_image: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
  };
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

const AllOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/order/admin/orders');
      console.log('Orders response:', response);
      const approvedOrders = response.filter((order: Order) => 
        order.payment_status === 'approved'
      );
      setOrders(approvedOrders);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: number) => {
    try {
      const response = await apiClient.get(`/order/admin/order/${orderId}`);
      setSelectedOrder(response);
    } catch (error: any) {
      console.error('Failed to fetch order detail:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load order details',
        variant: 'destructive'
      });
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const response = await apiClient.patch(`/order/${orderId}/status`, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: response.message || `Order #${orderId} status updated to ${newStatus}`
      });
      await fetchAllOrders();
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.message || 'Failed to update order status',
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: string; nextAction?: { label: string; next: string; icon: any } } } = {
      'payment_verified': {
        label: 'Payment Verified',
        variant: 'success',
        nextAction: { label: 'Start Processing', next: 'processing', icon: Package }
      },
      'processing': {
        label: 'Processing',
        variant: 'info',
        nextAction: { label: 'Mark as Completed', next: 'completed', icon: CheckCircle }
      },
      'completed': {
        label: 'Completed',
        variant: 'success',
        nextAction: null
      },
      'cancelled': {
        label: 'Cancelled',
        variant: 'danger',
        nextAction: null
      },
      'pending_payment': {
        label: 'Pending Payment',
        variant: 'warning',
        nextAction: null
      }
    };

    return statusMap[status] || { label: status.replace(/_/g, ' ').toUpperCase(), variant: 'default', nextAction: null };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">All Orders</h1>
          <Button size="sm" variant="outline" disabled>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
        <div className="rounded-lg bg-card shadow-card p-8 text-center text-muted-foreground">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">All Orders (Approved Payments)</h1>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchAllOrders}
          disabled={loading}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg bg-card shadow-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No approved payments to process</p>
          <p className="text-xs text-muted-foreground mt-2">Orders appear here after payment verification</p>
        </div>
      ) : (
        <div className="rounded-lg bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium">Payment</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
                <th className="px-4 py-3 text-center font-medium">Update</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => {
                const statusInfo = getStatusDisplay(order.status);
                const NextActionIcon = statusInfo.nextAction?.icon;
                return (
                  <tr key={order.id} className="h-auto py-2">
                    <td className="px-4 py-2 font-mono-data font-medium text-foreground">
                      #{order.id}
                    </td>
                    <td className="px-4 py-2 text-foreground">{order.user_name || 'N/A'}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{order.item_count} item(s)</td>
                    <td className="px-4 py-2 text-right font-mono-data font-medium">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <StatusBadge 
                        label={order.payment_status?.toUpperCase() || 'APPROVED'} 
                        variant="success"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <StatusBadge 
                        label={statusInfo.label} 
                        variant={statusInfo.variant as any} 
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => fetchOrderDetail(order.id)} 
                        className="h-7 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {statusInfo.nextAction && NextActionIcon && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, statusInfo.nextAction!.next)} 
                          disabled={updatingStatus === order.id}
                          className="h-7 gap-1"
                        >
                          <NextActionIcon className="h-3.5 w-3.5" />
                          {statusInfo.nextAction.label}
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <span className="text-xs text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              View complete order information including items and payment details
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedOrder.payment_method.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <StatusBadge 
                    label={selectedOrder.payment.status.toUpperCase()} 
                    variant={getPaymentStatusVariant(selectedOrder.payment.status)} 
                  />
                </div>
                <div>
                  <p className="text-muted-foreground">Order Status</p>
                  <StatusBadge 
                    label={selectedOrder.status.replace(/_/g, ' ').toUpperCase()} 
                    variant={getOrderStatusVariant(selectedOrder.status)} 
                  />
                </div>
                {selectedOrder.payment.verified_at && (
                  <div>
                    <p className="text-muted-foreground">Payment Verified At</p>
                    <p className="font-medium">{formatDate(selectedOrder.payment.verified_at)}</p>
                  </div>
                )}
                {selectedOrder.payment.rejection_reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Rejection Reason</p>
                    <p className="font-medium text-red-600">{selectedOrder.payment.rejection_reason}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left">Product</th>
                      <th className="py-2 text-right">Quantity</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                        <td className="py-2 text-right">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={3} className="py-2 text-right">Total:</td>
                      <td className="py-2 text-right">${selectedOrder.total_amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedOrder.payment.voucher_image && (
                <div>
                  <h3 className="font-medium mb-2">Payment Voucher</h3>
                  <div className="rounded-lg border border-border bg-secondary p-4">
                    <img 
                      src={`https://product-manager-vi61.onrender.com/${selectedOrder.payment.voucher_image}`}
                      alt="Payment Voucher"
                      className="max-w-full max-h-[300px] object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const errorMsg = document.createElement('p');
                          errorMsg.className = 'text-sm text-muted-foreground text-center';
                          errorMsg.textContent = 'Unable to load voucher image';
                          parent.appendChild(errorMsg);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllOrders;
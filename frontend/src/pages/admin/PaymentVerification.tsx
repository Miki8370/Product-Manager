import { useState, useEffect } from 'react';
import { StatusBadge, getPaymentStatusVariant, getOrderStatusVariant } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/api/client';

interface PendingPayment {
  payment_id: number;
  order_id: number;
  technician: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  payment_method: string;
  voucher_image: string | null;
  order_date: string;
  items: any[];
}

const PaymentVerification = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewVoucher, setPreviewVoucher] = useState<{ orderId: number, imageUrl: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching from /order/pending-verification...');
      const response = await apiClient.get('/order/pending-verification');
      console.log('Response:', response);
      setPayments(response || []);
    } catch (error: any) {
      console.error('Failed to fetch pending payments:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = error.message || 'Failed to load pending payments';
      if (error.response?.status === 401) {
        errorMessage = 'Unauthorized. Please make sure you are logged in as admin.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check the backend logs.';
      }
      
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: number) => {
    setProcessingId(paymentId);
    try {
      console.log('Approving payment:', paymentId);
      const response = await apiClient.post(`/order/verify-payment/${paymentId}`, {
        status: "approved"
      });
      console.log('Approve response:', response);
      toast({
        title: 'Payment Approved',
        description: response.message || 'Payment has been approved successfully'
      });
      await fetchPendingPayments();
    } catch (error: any) {
      console.error('Failed to approve payment:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.message || 'Failed to approve payment',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: number) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason === null) return;
    
    setProcessingId(paymentId);
    try {
      console.log('Rejecting payment:', paymentId, 'reason:', reason);
      const response = await apiClient.post(`/order/verify-payment/${paymentId}`, {
        status: "rejected",
        rejection_reason: reason
      });
      console.log('Reject response:', response);
      toast({
        title: 'Payment Rejected',
        description: response.message || 'Payment has been rejected'
      });
      await fetchPendingPayments();
    } catch (error: any) {
      console.error('Failed to reject payment:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.message || 'Failed to reject payment',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVoucherImageUrl = (voucherPath: string | null) => {
    if (!voucherPath) return null;
    if (voucherPath.startsWith('http')) return voucherPath;
    return `https://product-manager-vi61.onrender.com/${voucherPath}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Payment Verification</h1>
          <Button size="sm" variant="outline" disabled>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
        <div className="rounded-lg bg-card shadow-card p-8 text-center text-muted-foreground">
          Loading pending payments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Payment Verification</h1>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchPendingPayments}
          disabled={loading}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive p-4 text-destructive text-sm">
          <p className="font-medium">Error loading payments</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {!error && payments.length === 0 ? (
        <div className="rounded-lg bg-card shadow-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No pending payments to verify</p>
          <p className="text-xs text-muted-foreground mt-2">Make sure you've placed an order with voucher payment and you're logged in as admin</p>
        </div>
      ) : !error && payments.length > 0 ? (
        <div className="rounded-lg bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Payment ID</th>
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Technician</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium">Voucher</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((payment) => (
                <tr key={payment.payment_id} className="h-12">
                  <td className="px-4 py-2 font-mono-data font-medium text-foreground">
                    #{payment.payment_id}
                  </td>
                  <td className="px-4 py-2 font-mono-data font-medium text-foreground">
                    #{payment.order_id}
                  </td>
                  <td className="px-4 py-2 text-foreground">{payment.technician?.name || 'Unknown'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(payment.order_date)}</td>
                  <td className="px-4 py-2 text-right font-mono-data font-medium">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {payment.voucher_image ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setPreviewVoucher({ 
                          orderId: payment.order_id, 
                          imageUrl: getVoucherImageUrl(payment.voucher_image) || '' 
                        })}
                        className="h-7 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No voucher</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge label="PENDING" variant="warning" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleApprove(payment.payment_id)} 
                        disabled={processingId === payment.payment_id}
                        className="h-7 gap-1 text-green-600 hover:bg-green-600/10"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleReject(payment.payment_id)} 
                        disabled={processingId === payment.payment_id}
                        className="h-7 gap-1 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Dialog open={!!previewVoucher} onOpenChange={() => setPreviewVoucher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Voucher - Order #{previewVoucher?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-md border border-border bg-secondary p-4">
            {previewVoucher?.imageUrl ? (
              <img 
                src={previewVoucher.imageUrl} 
                alt="Payment Voucher" 
                className="max-w-full max-h-[60vh] object-contain"
                onError={(e) => {
                  console.error('Failed to load image:', previewVoucher.imageUrl);
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'text-sm text-muted-foreground';
                    errorMsg.textContent = 'Unable to load voucher image. The file may be missing or corrupted.';
                    parent.appendChild(errorMsg);
                  }
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No voucher image available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentVerification;
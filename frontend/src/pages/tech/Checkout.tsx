import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Upload, FileText } from 'lucide-react';

const TechCheckout = () => {
  const { items, total, fetchCart } = useCart();
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  if (items.length === 0) {
    navigate('/tech/cart', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!voucherFile) {
      toast({ 
        title: 'Voucher Required', 
        description: 'Please upload a payment voucher image.', 
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('Creating order with voucher payment...');
      
      const response = await apiClient.post('/order/checkout', null, {
        params: { payment_method: 'voucher' }
      });

      const orderId = response.order_id;
      console.log('Order created:', orderId);

      const formData = new FormData();
      formData.append('file', voucherFile);
      
      console.log('Uploading voucher for order:', orderId);
      
      await apiClient.post(`/order/${orderId}/upload-voucher`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast({ 
        title: 'Order Placed!', 
        description: 'Your order has been submitted. Please wait for payment verification.' 
      });

      await fetchCart();
      navigate('/tech/orders');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to place order', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Checkout</h1>

      <div className="rounded-lg bg-card p-4 shadow-card">
        <h2 className="text-sm font-medium text-foreground">Order Summary</h2>
        <div className="mt-3 divide-y divide-border text-sm">
          {items.map(({ id, product, quantity }) => (
            <div key={id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-mono-data text-xs text-muted-foreground">{product.sku}</span>
                <p className="text-foreground">{product.name} × {quantity}</p>
              </div>
              <span className="font-mono-data font-medium">${(product.price * quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium text-foreground">Total</span>
          <span className="text-lg font-semibold font-mono-data text-foreground">${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg bg-card p-4 shadow-card space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Payment Voucher (Required)</Label>
          <div className="mt-2">
            {voucherFile ? (
              <div className="flex items-center justify-between rounded-md border border-primary bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{voucherFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoucherFile(null)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload payment voucher</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or PDF up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Please upload a screenshot or photo of your payment receipt. The admin will verify it before processing your order.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </form>
    </div>
  );
};

export default TechCheckout;
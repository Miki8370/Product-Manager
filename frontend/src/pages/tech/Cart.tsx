import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

const TechCart = () => {
  const { items, removeItem, updateQuantity, total, clearCart, loading } = useCart();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleRemove = async (itemId: number) => {
    console.log('🔴 REMOVE - Cart Item ID:', itemId);
    setProcessingId(itemId);
    await removeItem(itemId);
    setProcessingId(null);
  };

  const handleQuantityUpdate = async (cartItemId: number, newQuantity: number) => {
    console.log('🟢 UPDATE - Cart Item ID:', cartItemId, 'New Quantity:', newQuantity);
    setProcessingId(cartItemId);
    await updateQuantity(cartItemId, newQuantity);
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Cart</h1>
        <div className="rounded-lg bg-card p-8 text-center text-muted-foreground">
          Loading cart...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Cart</h1>
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/tech/products" className="mt-4 inline-block">
            <Button variant="outline" size="sm">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Cart ({items.length})</h1>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">Clear All</Button>
      </div>

      <div className="rounded-lg bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-center font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              <th className="px-4 py-3 w-12"></th>
              </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const CART_ITEM_ID = item.id;
              const PRODUCT_ID = item.product.id;
              const productName = item.product.name;
              const price = item.product.price;
              const quantity = item.quantity;
              
              console.log(`📦 Rendering - Cart ID: ${CART_ITEM_ID} | Product ID: ${PRODUCT_ID} | Name: ${productName} | Qty: ${quantity}`);
              
              return (
                <tr key={CART_ITEM_ID} className="h-12">
                  <td className="px-4 py-2">
                    <span className="font-mono-data text-xs text-muted-foreground">{item.product.sku}</span>
                    <p className="text-sm font-medium text-foreground">{productName}</p>
                  </td>
                  <td className="px-4 py-2 text-right font-mono-data">${price.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleQuantityUpdate(CART_ITEM_ID, quantity - 1)} 
                        disabled={processingId === CART_ITEM_ID}
                        className="rounded p-1 hover:bg-accent disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-mono-data">{quantity}</span>
                      <button 
                        onClick={() => handleQuantityUpdate(CART_ITEM_ID, quantity + 1)} 
                        disabled={processingId === CART_ITEM_ID}
                        className="rounded p-1 hover:bg-accent disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right font-mono-data font-medium">${(price * quantity).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => handleRemove(CART_ITEM_ID)} 
                      disabled={processingId === CART_ITEM_ID}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold font-mono-data text-foreground">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Link to="/tech/checkout">
          <Button className="gap-2">Proceed to Checkout</Button>
        </Link>
      </div>
    </div>
  );
};

export default TechCart;
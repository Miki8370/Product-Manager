import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  total: number;
  itemCount: number;
  loading: boolean;
}

interface CartItemResponse {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      console.log('No user, clearing cart');
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      console.log('=== FETCHING CART ===');
      console.log('User ID:', user.id);
      console.log('User name:', user.name);
      
      const response = await apiClient.get<CartItemResponse[]>('/cart/');
      
      console.log('Cart API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      if (!response || !Array.isArray(response)) {
        console.log('Invalid response format, setting empty cart');
        setItems([]);
        return;
      }
      
      console.log('Cart items count:', response.length);
      console.log('Raw cart items:', response.map(item => ({ 
        id: item.id, 
        product_id: item.product_id, 
        quantity: item.quantity 
      })));
      
      const formattedItems: CartItem[] = await Promise.all(response.map(async (item) => {
        try {
          console.log(`Fetching product ${item.product_id}...`);
          const productData = await apiClient.get(`/products/${item.product_id}`);
          console.log(`Product ${item.product_id} data:`, productData);
          
          return {
            id: item.id,
            product: {
              id: item.product_id.toString(),
              name: productData.name,
              sku: `${productData.brand}-${productData.model}-${productData.quality}`.toUpperCase().replace(/\s/g, '-'),
              description: productData.description,
              price: productData.price,
              stock: productData.stock_level,
              minStock: 5,
              category: '',
              categoryId: productData.category_id,
            },
            quantity: item.quantity
          };
        } catch (error) {
          console.error(`Failed to fetch product ${item.product_id}:`, error);
          return {
            id: item.id,
            product: {
              id: item.product_id.toString(),
              name: `Product ${item.product_id}`,
              sku: '',
              description: '',
              price: 0,
              stock: 0,
              minStock: 5,
              category: '',
              categoryId: 0,
            },
            quantity: item.quantity
          };
        }
      }));
      
      console.log('Formatted items:', formattedItems.map(i => ({ 
        cartItemId: i.id, 
        productId: i.product.id, 
        productName: i.product.name, 
        price: i.product.price, 
        quantity: i.quantity 
      })));
      
      setItems(formattedItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (product: Product, quantity = 1) => {
    if (!user) {
      toast({ 
        title: 'Login required', 
        description: 'Please login to add items to cart.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      console.log('=== ADDING ITEM TO CART ===');
      console.log('Product:', product);
      console.log('Quantity:', quantity);
      console.log('Product ID:', parseInt(product.id));
      
      await apiClient.post('/cart/add', {
        product_id: parseInt(product.id),
        quantity: quantity
      });
      
      console.log('Item added successfully');
      await fetchCart();
      toast({ title: 'Added to cart', description: `${product.name} × ${quantity}` });
    } catch (error: any) {
      console.error('Failed to add item:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to add item to cart', 
        variant: 'destructive' 
      });
    }
  }, [user, toast, fetchCart]);

  const removeItem = useCallback(async (itemId: number) => {
    try {
      console.log('=== REMOVING ITEM ===');
      console.log('Item ID:', itemId);
      console.log('Full URL:', `/cart/item/${itemId}`);
      
      await apiClient.delete(`/cart/item/${itemId}`);
      console.log('Item removed successfully');
      
      await fetchCart();
      toast({ title: 'Removed', description: 'Item removed from cart' });
    } catch (error: any) {
      console.error('Failed to remove item:', error);
      console.error('Error status:', error.status);
      console.error('Error response:', error.response);
      
      if (error.message?.includes('404')) {
        toast({ 
          title: 'Error', 
          description: 'Item not found. It may have been already removed.', 
          variant: 'destructive' 
        });
        await fetchCart();
      } else {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to remove item', 
          variant: 'destructive' 
        });
      }
    }
  }, [toast, fetchCart]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    console.log('=== UPDATE QUANTITY CALLED ===');
    console.log('Item ID received:', itemId);
    console.log('New quantity:', quantity);
    console.log('Current items in cart:', items.map(i => ({ 
      cartItemId: i.id, 
      productId: i.product.id, 
      productName: i.product.name, 
      quantity: i.quantity 
    })));
    
    const itemExists = items.find(i => i.id === itemId);
    console.log('Item exists in cart?', itemExists ? 'YES' : 'NO');
    if (itemExists) {
      console.log('Found item:', { 
        cartItemId: itemExists.id, 
        productId: itemExists.product.id, 
        productName: itemExists.product.name,
        currentQuantity: itemExists.quantity,
        newQuantity: quantity
      });
    }
    
    if (quantity <= 0) {
      console.log('Quantity <= 0, removing item instead');
      await removeItem(itemId);
      return;
    }
    
    if (!itemExists) {
      console.error(`Item with ID ${itemId} not found in current cart!`);
      toast({ 
        title: 'Error', 
        description: `Item not found in cart. Please refresh the page.`, 
        variant: 'destructive' 
      });
      await fetchCart();
      return;
    }
    
    try {
      const url = `/cart/item/update/${itemId}`;
      const requestBody = { quantity: quantity };
      
      console.log('=== UPDATE QUANTITY DEBUG ===');
      console.log('URL:', url);
      console.log('HTTP Method: PUT');
      console.log('Request Body:', requestBody);
      console.log('Full request URL:', `https://product-manager-vi61.onrender.com${url}`);
      console.log('Auth token present:', !!localStorage.getItem('access_token'));
      
      const response = await apiClient.put(url, requestBody);
      console.log('Update response:', response);
      console.log('Quantity updated successfully');
      
      await fetchCart();
    } catch (error: any) {
      console.error('=== UPDATE QUANTITY ERROR ===');
      console.error('Error object:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      if (error.message?.includes('404')) {
        console.log('Item not found error - likely the item was deleted');
        toast({ 
          title: 'Error', 
          description: 'Item not found. It may have been already removed.', 
          variant: 'destructive' 
        });
        await fetchCart();
      } else if (error.message?.includes('403')) {
        console.log('Permission denied error');
        toast({ 
          title: 'Error', 
          description: 'You don\'t have permission to modify this item.', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to update quantity', 
          variant: 'destructive' 
        });
      }
    }
  }, [removeItem, toast, fetchCart, items]);

  const clearCart = useCallback(async () => {
    try {
      console.log('=== CLEARING CART ===');
      console.log('Items to remove:', items.map(i => ({ id: i.id, name: i.product.name })));
      
      for (const item of items) {
        if (item.id) {
          console.log(`Removing item ${item.id} (${item.product.name})`);
          await apiClient.delete(`/cart/item/${item.id}`);
        }
      }
      await fetchCart();
      toast({ title: 'Cart cleared', description: 'All items have been removed.' });
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to clear cart', 
        variant: 'destructive' 
      });
    }
  }, [items, toast, fetchCart]);

  const total = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      fetchCart,
      total, 
      itemCount,
      loading 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
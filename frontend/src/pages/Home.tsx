import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Minus, ShoppingCart, X, Upload, ArrowRight, Trash2, ImageIcon, LogOut, User, FileText, Filter, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getProducts } from '@/api/products';
import { getCategories } from '@/api/categroy';
import { StatusBadge, getStockVariant, getStockLabel } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';
import { useEffect } from 'react';

interface ApiProduct {
  id: number;
  name: string;
  price: number;
  category_id: number;
  description: string;
  model: string;
  brand: string;
  quality: string;
  stock_level: number;
  reserved_stock: number;
}

interface ApiCategory {
  id: number;
  name: string;
}

interface FormattedProduct {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  categoryId: number;
  brand: string;
  model: string;
  quality: string;
}

type HomeView = 'products' | 'cart' | 'checkout';

interface SearchFilters {
  search: string;
  category: string;
  brand: string;
  model: string;
  quality: string;
  minStock: number;
  maxStock: number;
  showLowStock: boolean;
  showOutOfStock: boolean;
}

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, fetchCart } = useCart();
  const { toast } = useToast();

  const [view, setView] = useState<HomeView>('products');
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: 'All',
    brand: '',
    model: '',
    quality: '',
    minStock: 0,
    maxStock: 999999,
    showLowStock: false,
    showOutOfStock: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  const [uniqueQualities, setUniqueQualities] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
        const categoryMap = new Map<number, string>();
        categoriesData.forEach((cat: ApiCategory) => {
          categoryMap.set(cat.id, cat.name.trim());
        });
        
        const formatted = productsData.map((p: ApiProduct) => ({
          id: p.id,
          name: p.name,
          sku: `${p.brand}-${p.model}-${p.quality}`.toUpperCase().replace(/\s/g, '-'),
          description: p.description,
          price: p.price,
          stock: p.stock_level,
          minStock: 5,
          category: (categoryMap.get(p.category_id) || 'Uncategorized').trim(),
          categoryId: p.category_id,
          brand: p.brand,
          model: p.model,
          quality: p.quality,
        }));
        
        setProducts(formatted);
        setCategories(categoriesData);
        
        // Extract unique values for filters
        const brands = [...new Set(formatted.map(p => p.brand).filter(b => b))];
        const models = [...new Set(formatted.map(p => p.model).filter(m => m))];
        const qualities = [...new Set(formatted.map(p => p.quality).filter(q => q))];
        
        setUniqueBrands(brands);
        setUniqueModels(models);
        setUniqueQualities(qualities);
        
        console.log('Available brands:', brands);
        console.log('Available models:', models);
        console.log('Available qualities:', qualities);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load products. Please try again.', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    navigate('/');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ 
        title: 'Login required', 
        description: 'Please login to place an order.', 
        variant: 'destructive' 
      });
      return;
    }
    
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
      const response = await apiClient.post('/order/checkout?payment_method=voucher');
      const orderId = response.order_id;

      const formData = new FormData();
      formData.append('file', voucherFile);
      
      await fetch(`https://product-manager-vi61.onrender.com/order/${orderId}/upload-voucher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData
      });
      
      toast({ 
        title: 'Order Placed!', 
        description: `Order #${orderId} has been submitted. Please wait for payment verification.` 
      });

      await fetchCart();
      setVoucherFile(null);
      setView('products');
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

  const categoryOptions = ['All', ...categories.map(cat => cat.name.trim())];
  const brandOptions = ['All', ...uniqueBrands];
  const modelOptions = ['All', ...uniqueModels];
  const qualityOptions = ['All', ...uniqueQualities];

  const filtered = products.filter(p => {
    const matchesSearch = filters.search === '' || 
      p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
      p.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.description.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = filters.category === 'All' || p.category.toLowerCase() === filters.category.toLowerCase();
    
    // Use partial matching (includes) for brand, model, and quality
    const matchesBrand = filters.brand === '' || filters.brand === 'All' || 
      p.brand.toLowerCase().includes(filters.brand.toLowerCase());
    
    const matchesModel = filters.model === '' || filters.model === 'All' || 
      p.model.toLowerCase().includes(filters.model.toLowerCase());
    
    const matchesQuality = filters.quality === '' || filters.quality === 'All' || 
      p.quality.toLowerCase().includes(filters.quality.toLowerCase());
    
    const matchesStock = p.stock >= filters.minStock && p.stock <= filters.maxStock;
    const matchesLowStock = !filters.showLowStock || (p.stock <= p.minStock && p.stock > 0);
    const matchesOutOfStock = !filters.showOutOfStock || p.stock === 0;
    
    // Debug logging
    if (filters.category !== 'All' && !matchesCategory) {
      console.log(`Product "${p.name}" category "${p.category}" does NOT match filter "${filters.category}"`);
    }
    if (filters.brand !== '' && filters.brand !== 'All' && !matchesBrand) {
      console.log(`Product "${p.name}" brand "${p.brand}" does NOT match filter "${filters.brand}"`);
    }
    if (filters.model !== '' && filters.model !== 'All' && !matchesModel) {
      console.log(`Product "${p.name}" model "${p.model}" does NOT match filter "${filters.model}"`);
    }
    if (filters.quality !== '' && filters.quality !== 'All' && !matchesQuality) {
      console.log(`Product "${p.name}" quality "${p.quality}" does NOT match filter "${filters.quality}"`);
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesModel && 
           matchesQuality && matchesStock && matchesLowStock && matchesOutOfStock;
  });

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      brand: '',
      model: '',
      quality: '',
      minStock: 0,
      maxStock: 999999,
      showLowStock: false,
      showOutOfStock: false,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">SparX</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Product Catalog</h1>
              <p className="mt-1 text-sm text-muted-foreground">Loading products...</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg bg-card p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">SparX</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView(view === 'cart' ? 'products' : 'cart')}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{user.name}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="gap-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm">Register</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {view === 'products' && (
          <div className="space-y-5 animate-enter">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Product Catalog</h1>
              <p className="mt-1 text-sm text-muted-foreground">Browse and order products from our catalog</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, SKU, or description..." 
                  value={filters.search} 
                  onChange={e => setFilters({ ...filters, search: e.target.value })} 
                  className="pl-9" 
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {(filters.brand || filters.model || filters.quality !== '' || filters.minStock > 0 || filters.maxStock < 999999 || filters.showLowStock || filters.showOutOfStock) && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
                )}
              </Button>
              {(filters.brand || filters.model || filters.quality !== '' || filters.minStock > 0 || filters.maxStock < 999999 || filters.showLowStock || filters.showOutOfStock) && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="rounded-lg bg-card p-4 shadow-card">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Category</Label>
                    <select
                      value={filters.category}
                      onChange={e => setFilters({ ...filters, category: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Brand</Label>
                    <select
                      value={filters.brand}
                      onChange={e => setFilters({ ...filters, brand: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">All Brands</option>
                      {brandOptions.filter(b => b !== 'All').map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Model</Label>
                    <select
                      value={filters.model}
                      onChange={e => setFilters({ ...filters, model: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">All Models</option>
                      {modelOptions.filter(m => m !== 'All').map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quality</Label>
                    <select
                      value={filters.quality}
                      onChange={e => setFilters({ ...filters, quality: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">All Qualities</option>
                      {qualityOptions.filter(q => q !== 'All').map(quality => (
                        <option key={quality} value={quality}>{quality}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Min Stock</Label>
                    <Input
                      type="number"
                      value={filters.minStock}
                      onChange={e => setFilters({ ...filters, minStock: parseInt(e.target.value) || 0 })}
                      className="font-mono-data"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Max Stock</Label>
                    <Input
                      type="number"
                      value={filters.maxStock === 999999 ? '' : filters.maxStock}
                      onChange={e => setFilters({ ...filters, maxStock: e.target.value ? parseInt(e.target.value) : 999999 })}
                      className="font-mono-data"
                      placeholder="No limit"
                    />
                  </div>

                  <div className="flex items-center gap-4 col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.showLowStock}
                        onChange={e => setFilters({ ...filters, showLowStock: e.target.checked })}
                        className="rounded border-border"
                      />
                      <span className="text-xs">Low Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.showOutOfStock}
                        onChange={e => setFilters({ ...filters, showOutOfStock: e.target.checked })}
                        className="rounded border-border"
                      />
                      <span className="text-xs">Out of Stock Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Found {filtered.length} product(s)
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(product => (
                <div 
                  key={product.id} 
                  className="group rounded-lg bg-card p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono-data text-xs font-bold text-muted-foreground">
                      {product.sku}
                    </span>
                    <StatusBadge 
                      label={getStockLabel(product.stock, product.minStock)} 
                      variant={getStockVariant(product.stock, product.minStock)} 
                    />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-foreground leading-tight">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Brand: {product.brand}</span>
                    <span>•</span>
                    <span>Model: {product.model}</span>
                    <span>•</span>
                    <span>Quality: {product.quality}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono-data text-base font-semibold text-foreground">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => addItem(product)} 
                      disabled={product.stock === 0} 
                      className="gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono-data">
                    Stock: {product.stock}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No products found matching your criteria.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cart View */}
        {view === 'cart' && (
          <div className="mx-auto max-w-2xl space-y-5 animate-enter">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground">Shopping Cart</h1>
              <Button variant="ghost" size="sm" onClick={() => setView('products')}>← Back to Products</Button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Your cart is empty</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setView('products')}>
                  Browse Products
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border rounded-lg bg-card shadow-card">
                  {items.map((item) => {
                    const CART_ITEM_ID = item.id;
                    const product = item.product;
                    const quantity = item.quantity;
                    
                    return (
                      <div key={CART_ITEM_ID} className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                          <p className="font-mono-data text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => updateQuantity(CART_ITEM_ID, quantity - 1)} 
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-mono-data text-sm font-medium text-foreground">
                            {quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(CART_ITEM_ID, quantity + 1)} 
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-20 text-right font-mono-data text-sm font-semibold text-foreground">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeItem(CART_ITEM_ID)} 
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-card">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-xl font-semibold font-mono-data text-foreground">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={clearCart}>
                    Clear Cart
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => setView('checkout')}>
                    Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Checkout View */}
        {view === 'checkout' && (
          <div className="mx-auto max-w-lg space-y-5 animate-enter">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>
              <Button variant="ghost" size="sm" onClick={() => setView('cart')}>← Back to Cart</Button>
            </div>

            <div className="rounded-lg bg-card p-4 shadow-card">
              <h2 className="text-sm font-medium text-foreground">Order Summary</h2>
              <div className="mt-3 divide-y divide-border text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-mono-data text-xs text-muted-foreground">{item.product.sku}</span>
                      <p className="text-foreground">{item.product.name} × {item.quantity}</p>
                    </div>
                    <span className="font-mono-data font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-lg font-semibold font-mono-data text-foreground">${total.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="rounded-lg bg-card p-4 shadow-card space-y-4">
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting || items.length === 0}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
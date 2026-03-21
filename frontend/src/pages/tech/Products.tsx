import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { StatusBadge, getStockVariant, getStockLabel } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Filter, XCircle } from 'lucide-react';
import { getProducts } from '@/api/products';
import { getCategories } from '@/api/categroy';

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

const TechProducts = () => {
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
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  const [uniqueQualities, setUniqueQualities] = useState<string[]>([]);

  const { addItem } = useCart();

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
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    const matchesBrand = filters.brand === '' || filters.brand === 'All' || p.brand.toLowerCase() === filters.brand.toLowerCase();
    const matchesModel = filters.model === '' || filters.model === 'All' || p.model.toLowerCase() === filters.model.toLowerCase();
    const matchesQuality = filters.quality === '' || filters.quality === 'All' || p.quality.toLowerCase() === filters.quality.toLowerCase();
    const matchesStock = p.stock >= filters.minStock && p.stock <= filters.maxStock;
    const matchesLowStock = !filters.showLowStock || (p.stock <= p.minStock && p.stock > 0);
    const matchesOutOfStock = !filters.showOutOfStock || p.stock === 0;
    
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
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Products</h1>
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
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Products</h1>

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
                <Plus className="h-3.5 w-3.5" />
                Add
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
  );
};

export default TechProducts;
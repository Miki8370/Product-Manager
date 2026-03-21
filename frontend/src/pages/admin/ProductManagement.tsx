import { useState } from 'react';
import { createProduct, updateProduct, deleteProduct, getProducts } from '@/api/products';
import { getCategories } from '@/api/categroy';
import { Product, ProductCategory } from '@/types';
import { StatusBadge, getStockVariant, getStockLabel } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect } from 'react';

interface ApiCategory {
  id: number;
  name: string;
}

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

const emptyForm = {
  name: '',
  description: '',
  brand: '',
  model: '',
  quality: '',
  price: 0,
  stock_level: 0,
  category_id: 0,
};

const ProductManagement = () => {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [editing, setEditing] = useState<FormattedProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load products', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { 
    setForm(emptyForm); 
    setCreating(true); 
    setEditing(null); 
  };
  
  const openEdit = (p: FormattedProduct) => { 
    setForm({
      name: p.name,
      description: p.description,
      brand: p.brand,
      model: p.model,
      quality: p.quality,
      price: p.price,
      stock_level: p.stock,
      category_id: p.categoryId,
    });
    setEditing(p); 
    setCreating(false); 
  };
  
  const close = () => { 
    setCreating(false); 
    setEditing(null); 
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.model || !form.quality || form.category_id === 0) {
      toast({ 
        title: 'Missing fields', 
        description: 'Please fill in all required fields', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      if (editing) {
        await updateProduct(editing.id, form);
        toast({ title: 'Product updated successfully' });
      } else {
        await createProduct(form);
        toast({ title: 'Product created successfully' });
      }
      await fetchData();
      close();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ 
        title: 'Error', 
        description: 'Failed to save product', 
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(id);
      toast({ title: 'Product deleted successfully' });
      await fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete product', 
        variant: 'destructive' 
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Product Management</h1>
          <Button size="sm" disabled className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Product</Button>
        </div>
        <div className="rounded-lg bg-card shadow-card overflow-x-auto">
          <div className="p-8 text-center text-muted-foreground">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Product Management</h1>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      <div className="rounded-lg bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map(p => (
              <tr key={p.id} className="h-12">
                <td className="px-4 py-2 font-mono-data text-xs font-bold text-foreground">{p.sku}</td>
                <td className="px-4 py-2 text-foreground">{p.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-2 text-right font-mono-data">${p.price.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-mono-data">{p.stock}</td>
                <td className="px-4 py-2 text-center">
                  <StatusBadge 
                    label={getStockLabel(p.stock, p.minStock)} 
                    variant={getStockVariant(p.stock, p.minStock)} 
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="h-7 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No products found. Click "Add Product" to create one.
          </div>
        )}
      </div>

      <Dialog open={creating || !!editing} onOpenChange={close}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name *</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category *</Label>
                <select 
                  value={form.category_id} 
                  onChange={e => setForm(f => ({ ...f, category_id: parseInt(e.target.value) }))} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Input 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Brand *</Label>
                <Input 
                  value={form.brand} 
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} 
                  placeholder="Brand name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Model *</Label>
                <Input 
                  value={form.model} 
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))} 
                  placeholder="Model number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quality *</Label>
                <Input 
                  value={form.quality} 
                  onChange={e => setForm(f => ({ ...f, quality: e.target.value }))} 
                  placeholder="Quality grade"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price *</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={form.price} 
                  onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} 
                  className="font-mono-data"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Stock Level *</Label>
                <Input 
                  type="number" 
                  value={form.stock_level} 
                  onChange={e => setForm(f => ({ ...f, stock_level: parseInt(e.target.value) }))} 
                  className="font-mono-data"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">SKU Preview</Label>
                <div className="font-mono-data text-xs bg-muted px-3 py-2 rounded-md">
                  {form.brand && form.model && form.quality 
                    ? `${form.brand}-${form.model}-${form.quality}`.toUpperCase().replace(/\s/g, '-')
                    : 'Will be auto-generated'}
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
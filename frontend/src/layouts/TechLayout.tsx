import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { LayoutDashboard, Package, ShoppingCart, ClipboardList, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/tech', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tech/products', label: 'Products', icon: Package },
  { to: '/tech/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/tech/orders', label: 'My Orders', icon: ClipboardList },
];

const TechLayout = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">SparX</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to} to={to} end={end}
                className={({ isActive }) => cn(
                  'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {label === 'Cart' && itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="ml-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 animate-enter">
        <Outlet />
      </main>
    </div>
  );
};

export default TechLayout;

import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-secondary text-muted-foreground',
  info: 'bg-primary/10 text-primary',
};

export const StatusBadge = ({ label, variant = 'neutral', className }: { label: string; variant?: BadgeVariant; className?: string }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>
    {label}
  </span>
);

export const getStockVariant = (stock: number, minStock: number): BadgeVariant => {
  if (stock === 0) return 'danger';
  if (stock < minStock) return 'warning';
  return 'success';
};

export const getStockLabel = (stock: number, minStock: number): string => {
  if (stock === 0) return 'Out of Stock';
  if (stock < minStock) return 'Low Stock';
  return 'In Stock';
};

export const getOrderStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'CONFIRMED': case 'DELIVERED': return 'success';
    case 'SHIPPED': return 'info';
    case 'PENDING': return 'warning';
    case 'CANCELLED': return 'danger';
    default: return 'neutral';
  }
};

export const getPaymentStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'VERIFIED': return 'success';
    case 'PENDING': return 'warning';
    case 'REJECTED': return 'danger';
    default: return 'neutral';
  }
};

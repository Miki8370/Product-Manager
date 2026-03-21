import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate(user.role === 'ADMIN' ? '/admin' : '/tech', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(username, password);
    setSubmitting(false);
    if (ok) {
      const stored = localStorage.getItem('sparx_user');
      const u = stored ? JSON.parse(stored) : null;
      navigate(u?.role === 'ADMIN' ? '/admin' : '/tech');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-enter">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Sign in to SparX</h1>
          <p className="mt-1 text-xs text-muted-foreground">Electronic parts inventory system</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-card p-6 shadow-card">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs">Username or Email</Label>
            <Input 
              id="username" 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="Enter your username or email" 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
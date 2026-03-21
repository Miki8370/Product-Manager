import { useState, useEffect } from 'react';
import { User, UserStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Crown, Search, UserPlus } from 'lucide-react';
import { apiClient } from '@/api/client';

interface ApiUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
}

const UserApprovals = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ 
    username: '', 
    email: '', 
    password: '',
    first_name: '',
    last_name: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiUser[]>('/admin/users');
      
      const formattedUsers: User[] = response.map(user => ({
        id: user.id.toString(),
        name: `${user.first_name} ${user.last_name}`.trim() || user.username,
        email: user.email,
        role: user.is_admin ? 'ADMIN' : 'TECHNICIAN',
        status: user.is_approved ? 'APPROVED' : 'PENDING',
        createdAt: new Date(user.created_at).toLocaleDateString(),
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load users', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await apiClient.patch(`/admin/users/${id}/approve`);
        toast({ title: 'User approved', description: 'User has been approved successfully.' });
      } else {
        await apiClient.patch(`/admin/users/${id}/reject`);
        toast({ title: 'User rejected', description: 'User has been rejected and removed.' });
      }
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast({ 
        title: 'Error', 
        description: error.message || `Failed to ${action} user`, 
        variant: 'destructive' 
      });
    }
  };

  const createAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password || !newAdmin.first_name || !newAdmin.last_name) {
      toast({ title: 'Missing fields', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/signup/', {
        first_name: newAdmin.first_name,
        last_name: newAdmin.last_name,
        username: newAdmin.username,
        email: newAdmin.email,
        password: newAdmin.password,
      });

      const createdUser = users.find(u => u.email === newAdmin.email);
      
      if (createdUser) {
        await apiClient.patch(`/admin/users/${createdUser.id}/approve`);
        await apiClient.patch(`/admin/users/${createdUser.id}/is_admin`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedUsers = await apiClient.get<ApiUser[]>('/admin/users');
        const newUser = updatedUsers.find(u => u.email === newAdmin.email);
        if (newUser) {
          await apiClient.patch(`/admin/users/${newUser.id}/approve`);
          await apiClient.patch(`/admin/users/${newUser.id}/is_admin`);
        }
      }

      toast({ title: 'Admin created', description: 'Admin account has been created and activated.' });
      setShowAdminModal(false);
      setNewAdmin({ username: '', email: '', password: '', first_name: '', last_name: '' });
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to create admin:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create admin', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusVariant = (status: UserStatus) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(u => u.status === 'PENDING' && u.role !== 'ADMIN');
  const approvedUsers = filteredUsers.filter(u => u.status === 'APPROVED');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">User Approvals</h1>
          <Button size="sm" disabled className="gap-1"><UserPlus className="h-3.5 w-3.5" /> Create Admin</Button>
        </div>
        <div className="rounded-lg bg-card shadow-card p-8 text-center text-muted-foreground">
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">User Management</h1>
        <Button size="sm" onClick={() => setShowAdminModal(true)} className="gap-1">
          <UserPlus className="h-3.5 w-3.5" /> Create Admin
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {pendingUsers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Pending Approvals</h2>
          <div className="rounded-lg bg-card shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Registered</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingUsers.map(user => (
                  <tr key={user.id} className="h-12">
                    <td className="px-4 py-2 font-medium text-foreground">{user.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-2 text-muted-foreground">{user.createdAt}</td>
                    <td className="px-4 py-2 text-center">
                      <StatusBadge label={user.status} variant={getStatusVariant(user.status)} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => updateStatus(user.id, 'approve')} 
                          className="h-7 gap-1 text-green-600 hover:bg-green-600/10"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => updateStatus(user.id, 'reject')} 
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
        </div>
      )}

      {approvedUsers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Users</h2>
          <div className="rounded-lg bg-card shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Registered</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approvedUsers.map(user => (
                  <tr key={user.id} className="h-12">
                    <td className="px-4 py-2 font-medium text-foreground">{user.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1">
                          <Crown className="h-3 w-3 text-yellow-600" />
                          Admin
                        </span>
                      ) : (
                        'Technician'
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{user.createdAt}</td>
                    <td className="px-4 py-2 text-center">
                      <StatusBadge label={user.status} variant={getStatusVariant(user.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="rounded-lg bg-card shadow-card p-8 text-center text-muted-foreground">
          No users found
        </div>
      )}

      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={newAdmin.first_name}
                  onChange={e => setNewAdmin({ ...newAdmin, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newAdmin.last_name}
                  onChange={e => setNewAdmin({ ...newAdmin, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={newAdmin.username}
                onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                placeholder="admin_username"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={createAdmin} disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserApprovals;
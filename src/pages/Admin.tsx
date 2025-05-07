
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  avatar_url: string | null;
  is_admin: boolean;
}

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (user && !isAdmin) {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }

    if (!user) {
      toast.error('Please sign in to access this page');
      navigate('/auth');
      return;
    }

    // Fetch all user profiles if admin
    if (isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setIsPromoting(!userProfile.is_admin);
    setIsDialogOpen(true);
  };

  const confirmToggleAdmin = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: !selectedUser.is_admin
        })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast.success(`User ${!selectedUser.is_admin ? 'promoted to' : 'removed from'} admin role`);
      setIsDialogOpen(false);
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p>You do not have permission to view this page</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users and system settings
            </p>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[300px]"
            />
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">User</th>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Joined</th>
                        <th className="px-4 py-2 text-left">Role</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userProfile) => (
                        <tr key={userProfile.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-medium">
                                {userProfile.full_name?.charAt(0)?.toUpperCase() || 
                                 userProfile.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span>{userProfile.full_name || 'No Name'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">@{userProfile.username || 'No Username'}</td>
                          <td className="px-4 py-3">{new Date(userProfile.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              userProfile.is_admin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                            }`}>
                              {userProfile.is_admin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleAdmin(userProfile)}
                              disabled={userProfile.id === user?.id} // Cannot change own admin status
                            >
                              {userProfile.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  No users found matching your search
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isPromoting ? 'Promote to Admin' : 'Remove Admin Rights'}
              </DialogTitle>
              <DialogDescription>
                {isPromoting
                  ? `Are you sure you want to give ${selectedUser?.full_name || selectedUser?.username} admin privileges?`
                  : `Are you sure you want to remove admin privileges from ${selectedUser?.full_name || selectedUser?.username}?`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                variant={isPromoting ? "default" : "destructive"} 
                onClick={confirmToggleAdmin}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Admin;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const profileSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .refine(val => /^[a-zA-Z0-9_-]+$/.test(val), {
      message: 'Username can only contain letters, numbers, underscores, and hyphens',
    }),
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  avatarUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || '',
      fullName: profile?.full_name || '',
      avatarUrl: profile?.avatar_url || '',
    },
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access your profile');
      navigate('/auth');
    }

    if (profile) {
      form.setValue('username', profile.username || '');
      form.setValue('fullName', profile.full_name || '');
      form.setValue('avatarUrl', profile.avatar_url || '');
    }
  }, [user, profile, loading, navigate, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          full_name: values.fullName,
          avatar_url: values.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      
      // Force a page reload to refresh profile data
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Your avatar will be visible to other users
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl">
                    {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Your Profile</CardTitle>
                <CardDescription>
                  Update your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

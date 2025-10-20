import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Save, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileData {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  location?: string;
  profile_image_url?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  parent_name?: string;
  parent_zalo_nr?: string;
}

interface ProfileEditorProps {
  userType: 'student' | 'teacher' | 'admin';
  trigger?: React.ReactNode;
}

export function ProfileEditor({ userType, trigger }: ProfileEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    location: '',
    profile_image_url: '',
    bio: '',
    gender: '',
    birthday: '',
    parent_name: '',
    parent_zalo_nr: '',
  });

  useEffect(() => {
    if (open) {
      fetchProfileData();
    }
  }, [open]);

  const fetchProfileData = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      let table = '';
      let query;

      if (userType === 'student') {
        table = 'dashboard_students';
        query = supabase.from(table).select('*').eq('email', user.email).single();
      } else if (userType === 'teacher') {
        table = 'teachers';
        query = supabase.from(table).select('*').eq('email', user.email).single();
      } else {
        // For admin, use auth.users metadata
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setProfileData({
            name: authUser.user_metadata?.name || '',
            surname: authUser.user_metadata?.surname || '',
            email: authUser.email || '',
            phone: authUser.user_metadata?.phone || '',
            location: authUser.user_metadata?.location || '',
            profile_image_url: authUser.user_metadata?.avatar_url || '',
          });
        }
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setProfileData({
          name: data.name || '',
          surname: data.surname || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          profile_image_url: data.profile_image_url || '',
          bio: data.bio || '',
          gender: data.gender || '',
          birthday: data.birthday || '',
          parent_name: data.parent_name || '',
          parent_zalo_nr: data.parent_zalo_nr || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.email}-${Date.now()}.${fileExt}`;
      const filePath = `${userType}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, profile_image_url: publicUrl }));

      toast({
        title: 'Image Uploaded',
        description: 'Profile image uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userType === 'student') {
        const { error } = await supabase
          .from('dashboard_students')
          .update({
            name: profileData.name,
            surname: profileData.surname,
            phone: profileData.phone,
            location: profileData.location,
            profile_image_url: profileData.profile_image_url,
            gender: profileData.gender,
            birthday: profileData.birthday,
            parent_name: profileData.parent_name,
            parent_zalo_nr: profileData.parent_zalo_nr,
          })
          .eq('email', user?.email);

        if (error) throw error;
      } else if (userType === 'teacher') {
        const { error } = await supabase
          .from('teachers')
          .update({
            name: profileData.name,
            surname: profileData.surname,
            phone: profileData.phone,
            profile_image_url: profileData.profile_image_url,
          })
          .eq('email', user?.email);

        if (error) throw error;
      } else {
        // Update auth.users metadata for admin
        const { error } = await supabase.auth.updateUser({
          data: {
            name: profileData.name,
            surname: profileData.surname,
            phone: profileData.phone,
            location: profileData.location,
            avatar_url: profileData.profile_image_url,
          },
        });

        if (error) throw error;
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });

      setOpen(false);

      // Trigger page reload to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and preferences
          </DialogDescription>
        </DialogHeader>

        {loading && !profileData.email ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.profile_image_url} alt="Profile" />
                <AvatarFallback className="text-2xl">
                  {profileData.name?.[0]}{profileData.surname?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition">
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {profileData.profile_image_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileData(prev => ({ ...prev, profile_image_url: '' }))}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">First Name *</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  value={profileData.surname}
                  onChange={(e) => setProfileData(prev => ({ ...prev, surname: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0901234567"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileData.location || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Hanoi, HCMC, etc."
                />
              </div>
            </div>

            {/* Student-specific fields */}
            {userType === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profileData.gender || ''}
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={profileData.birthday || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, birthday: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parent_name">Parent Name</Label>
                    <Input
                      id="parent_name"
                      value={profileData.parent_name || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, parent_name: e.target.value }))}
                      placeholder="Parent's full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_zalo">Parent Zalo</Label>
                    <Input
                      id="parent_zalo"
                      type="tel"
                      value={profileData.parent_zalo_nr || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, parent_zalo_nr: e.target.value }))}
                      placeholder="0901234567"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

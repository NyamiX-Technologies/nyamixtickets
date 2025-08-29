import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Loader2, User, Upload, CheckCircle } from 'lucide-react';
import nyamixLogo from '@/assets/logo.png';

export default function UpdateProfile() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if coming from signup
  const fromSignup = location.state?.fromSignup === true;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    setIsLoading(true);
  
    try {
      // Prepare FormData
      const data = new FormData();
      data.append('first_name', formData.first_name.trim());
      data.append('last_name', formData.last_name.trim());
      data.append('phone_number', formData.phone_number.trim());
  
      if (formData.date_of_birth) {
        data.append('date_of_birth', formData.date_of_birth);
      }
  
      if (avatar) {
        data.append('avatar', avatar);
      }
  
      // Make API request
      const response = await apiClient.patch('/accounts/profile/update/', data);
  
      // Check if response is OK
      if (!response) {
        throw new Error('Failed to update profile');
      }
  
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
  
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'Failed to update profile';
  
      // Similar to Dio's validation handling
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const apiErrors: string[] = [];
  
        for (const [key, value] of Object.entries(error)) {
          if (Array.isArray(value)) {
            apiErrors.push(...value.map(v => String(v)));
          } else {
            apiErrors.push(String(value));
          }
        }
  
        if (apiErrors.length > 0) {
          errorMessage = apiErrors.join('\n');
        }
      }
  
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-lg border-border/50">
          <div className="text-center mb-8">
            <img 
              src={nyamixLogo} 
              alt="NyamiX Logo" 
              className="w-20 h-20 mx-auto mb-4 rounded-full" 
            />
            <h1 className="text-3xl font-bold text-foreground">
              {fromSignup ? 'Complete Your Profile' : 'Update Your Profile'}
            </h1>
            <p className="text-muted-foreground">
              {fromSignup ? 'A few more details to get started' : 'Update your personal information'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="relative w-32 h-32 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors overflow-hidden">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <span className="text-xs">Upload Photo</span>
                      <span className="block text-xs text-muted-foreground">(Optional)</span>
                    </div>
                  )}
                </div>
                <Input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange} 
                />
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input 
                  id="first_name" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleInputChange}
                  className={errors.first_name ? 'border-destructive' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input 
                  id="last_name" 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleInputChange}
                  className={errors.last_name ? 'border-destructive' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input 
                id="phone_number" 
                name="phone_number" 
                type="tel" 
                placeholder="+260"
                value={formData.phone_number} 
                onChange={handleInputChange}
                className={errors.phone_number ? 'border-destructive' : ''}
              />
              {errors.phone_number && (
                <p className="text-sm text-destructive">{errors.phone_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
              <Input 
                id="date_of_birth" 
                name="date_of_birth" 
                type="date" 
                value={formData.date_of_birth} 
                onChange={handleInputChange} 
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full font-semibold" 
                disabled={isLoading} 
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {fromSignup ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Complete Registration</span>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5" />
                        <span>Update Profile</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
              
              {!fromSignup && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import nyamixLogo from '@/assets/nyamix.jpg';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const { email, username, password } = formData;

    if (!email.trim() || !username.trim() || !password.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return false;
    }

    if (!email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await authService.signup({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password
      });

      toast({
        title: "Account created successfully!",
        description: "Please log in with your new account",
      });

      navigate('/login');
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast({
        title: "Signup failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mellow-lime/50 via-gray-100/20 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 rounded-[16px] shadow-lg bg-white/90 backdrop-blur-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="flex items-center justify-center mb-4 transform hover:scale-105 transition-all duration-300"
            >
              <img
                src={nyamixLogo}
                alt="NyamiX Logo"
                className="w-20 h-20 object-contain"
              />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Join NyamiX</h1>
            <p className="text-muted-foreground mt-2">
              Create your account to start booking tickets
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {['email', 'username'].map((field) => (
              <div className="space-y-2" key={field}>
                <Label htmlFor={field} className="text-sm font-medium">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Label>
                <Input
                  id={field}
                  type={field === 'email' ? 'email' : 'text'}
                  placeholder={`Enter your ${field}`}
                  value={(formData as any)[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  disabled={isLoading}
                  className="h-14 px-4 text-base w-full border border-gray-300 rounded-[56px] focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  className="h-14 px-4 pr-14 text-base w-full border border-gray-300 rounded-[56px] focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 text-base w-full nyamix-button-primary flex justify-center items-center gap-2 hover:bg-primary/90 transition-all rounded-[56px] font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
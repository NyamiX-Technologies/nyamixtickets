import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import nyamixLogo from '@/assets/newlogo.jpeg';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.login({ username, password });

      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully",
      });

      // Call the success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // Default navigation if no callback provided
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error?.message || "Please check your credentials",
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 rounded-[5px] shadow-lg bg-card">
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
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your NyamiX account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isLoading}
                className="h-14 px-4 text-base w-full border border-border bg-transparent rounded-[56px] focus:border-primary focus:ring focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  className="h-14 px-4 pr-14 text-base w-full border border-border bg-transparent rounded-[56px] focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 text-base w-full nyamix-button-primary flex justify-center items-center gap-2 hover:bg-primary/90 transition-all rounded-[56px] font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
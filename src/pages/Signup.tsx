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
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const { email, username, password, confirmPassword } = formData;

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

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {['email', 'username'].map((field) => (
              <div className="space-y-2" key={field}>
                <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  id={field}
                  type={field === 'email' ? 'email' : 'text'}
                  placeholder={`Enter your ${field}`}
                  value={(formData as any)[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  disabled={isLoading}
                  className="w-full border border-gray-300 rounded-[56px] focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                />
              </div>
            ))}

            {['password', 'confirmPassword'].map((field) => {
              const show = field === 'password' ? showPassword : showConfirmPassword;
              const toggle = field === 'password' ? setShowPassword : setShowConfirmPassword;
              const placeholder = field === 'password' ? 'Create a password' : 'Confirm your password';

              return (
                <div className="space-y-2" key={field}>
                  <Label htmlFor={field}>{field === 'password' ? 'Password' : 'Confirm Password'}</Label>
                  <div className="relative">
                    <Input
                      id={field}
                      type={show ? 'text' : 'password'}
                      placeholder={placeholder}
                      value={(formData as any)[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      disabled={isLoading}
                      className="w-full pr-12 border border-gray-300 rounded-[56px] focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => toggle(!show)}
                      disabled={isLoading}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full nyamix-button-primary flex justify-center items-center gap-2 hover:bg-primary/90 transition-all rounded-[56px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Creating account...
                </div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
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

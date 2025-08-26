import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/auth';
import { LogOut, User, Home, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import nyamixLogo from '@/assets/nyamix-logo.png';

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "Come back soon!",
    });
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={nyamixLogo} 
            alt="NyamiX Logo" 
            className="h-10 w-10 object-contain"
          />
          <span className="text-2xl font-bold text-foreground">NyamiX</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          
          {isAuthenticated && (
            <Link
              to="/tickets"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Ticket className="h-4 w-4" />
              My Tickets
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="nyamix-button-primary"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
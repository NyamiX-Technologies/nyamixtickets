import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { authService, User as AuthUser } from '@/lib/auth';
import { LogOut, User, Home, Ticket, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import nyamixLogo from '@/assets/nyamix.jpg';
import { useState, useEffect } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = authService.isAuthenticated();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const user = await authService.getMe();
          setCurrentUser(user);
        } catch (error) {
          console.error('Failed to fetch user details:', error);
          // Optionally, handle token expiration or re-authentication
          authService.logout();
          navigate('/login');
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
        }
      } else {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, [isAuthenticated, navigate, toast]);

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
      transition={{ type: "spring", stiffness: 80 }}
      className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-md shadow-sm"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-gray-100 hover:shadow-lg transition-all">
            <img
              src={nyamixLogo}
              alt="NyamiX Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-all hover:scale-105 active:scale-95 font-medium"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          {isAuthenticated && (
            <Link
              to="/tickets"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-all hover:scale-105 active:scale-95 font-medium"
            >
              <Ticket className="h-4 w-4" />
              My Tickets
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.username || 'User'}`} alt="@user" />
                    <AvatarFallback>{currentUser?.username ? currentUser.username.charAt(0) : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="border-border/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-xl"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md text-white font-medium rounded-xl transition-all duration-200"
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

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
  const defaultAvatarUrl = 'https://firebasestorage.googleapis.com/v0/b/authenification-b4dc9.appspot.com/o/uploads%2Favatar.png?alt=media&token=7da81de9-a163-4296-86ac-3194c490ce15';

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
      className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
            <img
              src={nyamixLogo}
              alt="NyamiX Logo"
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
          </div>
          <span className="text-xl font-bold text-gray-900 md:hidden">NyamiX</span>
        </Link>

       

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition-colors font-medium text-sm"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          {isAuthenticated && (
            <Link
              to="/tickets"
              className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition-colors font-medium text-sm"
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
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage 
                      src={currentUser?.avatar || defaultAvatarUrl} 
                      alt={currentUser?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-700">
                      {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
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
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 text-sm">
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
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm rounded-lg"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="bg-lime-600 hover:bg-lime-700 shadow-sm text-white font-medium text-sm rounded-lg"
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
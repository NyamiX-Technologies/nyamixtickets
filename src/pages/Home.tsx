import { useState, useEffect } from 'react';
import { EventCard } from '@/components/EventCard';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { FloatingTicketCounter } from '@/components/FloatingTicketCounter';
import { Button } from '@/components/ui/button';
import { Event, Category, eventService, Ticket } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Ticket as TicketIcon, Sparkles, Calendar, Zap, AlertCircle, User } from 'lucide-react';
import { authService } from '@/lib/auth';
import { Login } from './Login';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  avatar: string | null;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(0);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    if (!isAuthenticated) return;
    
    try {
      const profile = await apiClient.get<UserProfile>('/accounts/profile/');
      setUserProfile(profile);
      
      // Check if profile is complete
      const isComplete = profile.first_name && profile.last_name && profile.phone;
      setProfileComplete(!!isComplete);
      
      // Store profile in local storage for other components
      localStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If profile doesn't exist, it's incomplete
      setProfileComplete(false);
    }
  };

  useEffect(() => {
    // Check authentication status when component mounts
    const checkAuth = () => {
      const wasAuthenticated = isAuthenticated;
      const isNowAuthenticated = authService.isAuthenticated();
      setIsAuthenticated(isNowAuthenticated);
      
      // If user just logged in, fetch their profile
      if (!wasAuthenticated && isNowAuthenticated) {
        fetchUserProfile();
      }
    };
    
    // Set up an event listener for auth changes
    window.addEventListener('storage', checkAuth);
    
    // Initial check
    checkAuth();
    
    // Load data if authenticated
    if (isAuthenticated) {
      loadData();
      loadUserTickets();
      fetchUserProfile();
    }
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [eventsData, categoriesData] = await Promise.all([
        eventService.getHomeEvents(),
        eventService.getCategories()
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserTickets = async () => {
    setTicketsLoading(true);
    try {
      const tickets = await eventService.getUserTickets();
      setUserTickets(tickets);
      setTicketCount(tickets.length);
    } catch (error) {
      console.error('Failed to load user tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadCategoryEvents = async (categoryId: string) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    
    try {
      const categoryEvents = await eventService.getEventsByCategory(categoryId);
      setEvents(categoryEvents);
    } catch (error) {
      toast({
        title: "Failed to load category events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllEvents = async () => {
    setSelectedCategory(null);
    setLoading(true);
    
    try {
      const allEvents = await eventService.getHomeEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load all events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleTicketPurchased = () => {
    setTicketCount(prev => prev + 1);
    // Refresh user tickets after purchase
    loadUserTickets();
  };

  const handleTicketsNavigation = () => {
    navigate('/tickets');
  };

  // If not authenticated, show the login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Login onLoginSuccess={() => {
          setIsAuthenticated(true);
          fetchUserProfile();
        }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-primary mx-auto mb-6"></div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-semibold text-lg">Loading Events</p>
            <p className="text-muted-foreground text-sm">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!profileComplete && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200 mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Complete your profile</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              Please update your profile information to ensure event hosts can contact you if needed.
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-900/50"
              onClick={() => navigate('/update-profile')}
            >
              <User className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
              Discover Events
            </h1>
            <p className="text-muted-foreground text-xl">
              Find and book the most amazing experiences
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">{events.length}</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="lg"
              onClick={handleShowAllEvents}
              className="rounded-full px-6 py-3 font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              All Events
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => loadCategoryEvents(category.id)}
                className="rounded-full px-6 py-3 font-medium"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-6xl mx-auto pb-24">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="group transition-all duration-300"
                >
                  <EventCard
                    event={event}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-card rounded-xl p-12 border border-border shadow-sm max-w-lg mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">No Events Found</h3>
                <p className="text-muted-foreground mb-8">
                  {selectedCategory 
                    ? "No events available in this category" 
                    : "No events are currently available"
                  }
                </p>
                {selectedCategory && (
                  <Button 
                    onClick={handleShowAllEvents} 
                    className="rounded-lg px-6 py-3 font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    View All Events
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EventDetailsModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onTicketPurchased={handleTicketPurchased}
      />

      <FloatingTicketCounter
        ticketCount={ticketCount}
        onClick={() => navigate('/tickets')}
      />
    </div>
  );
}
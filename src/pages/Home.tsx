import { useState, useEffect } from 'react';
import { EventCard } from '@/components/EventCard';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { FloatingTicketCounter } from '@/components/FloatingTicketCounter';
import { Button } from '@/components/ui/button';
import { Event, Category, eventService, Ticket } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Ticket as TicketIcon, Sparkles, Calendar, Zap } from 'lucide-react';
import { authService } from '@/lib/auth';
import Login from './Login';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status when component mounts
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    // Set up an event listener for auth changes
    window.addEventListener('storage', checkAuth);
    
    // Initial check
    checkAuth();
    
    // Load data if authenticated
    if (isAuthenticated) {
      loadData();
      loadUserTickets();
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
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-lime-500 mx-auto mb-6"></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700 font-semibold text-lg">Loading Events</p>
            <p className="text-gray-500 text-sm">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">
              Discover Events
            </h1>
            <p className="text-gray-600 text-xl">
              Find and book the most amazing experiences
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-semibold text-lime-600">{events.length}</div>
                <div className="text-sm text-gray-500">Events</div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-lime-600">{categories.length}</div>
                <div className="text-sm text-gray-500">Categories</div>
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
              className={`rounded-[56px] px-6 py-3 font-medium ${
                selectedCategory === null 
                  ? "bg-lime-600 hover:bg-lime-700 text-white" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
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
                className={`rounded-[56px] px-6 py-3 font-medium ${
                  selectedCategory === category.id
                    ? "bg-lime-600 hover:bg-lime-700 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
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
                    onClick={handleEventClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm max-w-lg mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">No Events Found</h3>
                <p className="text-gray-600 mb-8">
                  {selectedCategory 
                    ? "No events available in this category" 
                    : "No events are currently available"
                  }
                </p>
                {selectedCategory && (
                  <Button 
                    onClick={handleShowAllEvents} 
                    className="rounded-lg px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white font-medium"
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
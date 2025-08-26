import { useState, useEffect } from 'react';
import { EventCard } from '@/components/EventCard';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { FloatingTicketCounter } from '@/components/FloatingTicketCounter';
import { Button } from '@/components/ui/button';
import { Event, Category, eventService, Ticket } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Ticket as TicketIcon, Sparkles, Calendar, Zap } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(0);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadUserTickets();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-yellow-50 to-amber-50">
        <div className="text-center">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-lime-500 border-r-yellow-500 mx-auto mb-6 drop-shadow-lg"></div>
            {/* Inner counter-spinning ring */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-b-amber-500 border-l-lime-600" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-6 w-4 h-4 bg-gradient-to-r from-lime-500 to-yellow-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-black font-bold text-lg">Loading Events</p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-yellow-50/30 to-amber-50">
      <div className="p-6">
        {/* Animated Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center space-y-6">
            <div className="relative">
              <h1 className="text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-lime-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-in slide-in-from-top duration-1000">
                Discover Events
              </h1>
              {/* Floating sparkles */}
              <div className="absolute -top-4 left-1/4 animate-bounce">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
              <div className="absolute top-0 right-1/3 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Zap className="w-5 h-5 text-lime-500 animate-pulse" />
              </div>
            </div>
            <p className="text-black font-medium text-xl animate-in slide-in-from-bottom duration-1000 delay-300">
              Find and book the most amazing experiences
            </p>
            
            {/* Animated stats */}
            <div className="flex justify-center items-center space-x-8 animate-in fade-in duration-1000 delay-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-600 animate-pulse">{events.length}</div>
                <div className="text-sm text-black/70">Events</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-lime-300 to-transparent"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 animate-pulse">{categories.length}</div>
                <div className="text-sm text-black/70">Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Categories */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex gap-3 flex-wrap justify-center animate-in slide-in-from-left duration-1000 delay-700">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="lg"
              onClick={handleShowAllEvents}
              className={`group relative overflow-hidden rounded-[50px] px-8 py-4 font-semibold transition-all duration-500 ${
                selectedCategory === null 
                  ? "bg-gradient-to-r from-lime-500 via-yellow-500 to-amber-500 hover:from-lime-600 hover:via-yellow-600 hover:to-amber-600 text-black shadow-xl shadow-lime-200 scale-105" 
                  : "hover:bg-lime-50 border-lime-300 text-black hover:border-lime-400 hover:shadow-lg hover:shadow-lime-100"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-lime-600 to-yellow-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <Sparkles className="w-5 h-5 mr-3 group-hover:animate-spin" />
              <span className="relative z-10">All Events</span>
              {selectedCategory === null && (
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"></div>
              )}
            </Button>
            
            {categories.map((category, index) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => loadCategoryEvents(category.id)}
                className={`group relative overflow-hidden rounded-[50px] px-8 py-4 font-semibold transition-all duration-500 animate-in slide-in-from-right ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-lime-500 via-yellow-500 to-amber-500 hover:from-lime-600 hover:via-yellow-600 hover:to-amber-600 text-black shadow-xl shadow-lime-200 scale-105"
                    : "hover:bg-lime-50 border-lime-300 text-black hover:border-lime-400 hover:shadow-lg hover:shadow-lime-100"
                }`}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-lime-600 to-yellow-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <span className="relative z-10">{category.name}</span>
                {selectedCategory === category.id && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"></div>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Events Grid with Stagger Animation */}
        <div className="max-w-6xl mx-auto pb-24">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="group transform hover:scale-110 transition-all duration-500 hover:z-10 relative animate-in fade-in slide-in-from-bottom"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationDuration: '800ms'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-400/20 to-yellow-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl transform scale-110"></div>
                  <EventCard
                    event={event}
                    onClick={handleEventClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-in fade-in duration-1000">
              <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-16 border border-white/40 shadow-2xl shadow-lime-100/50 max-w-lg mx-auto">
                {/* Floating background elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-lime-200/30 to-yellow-200/30 rounded-full animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-lime-100 to-yellow-100 rounded-full flex items-center justify-center animate-bounce">
                    <Calendar className="w-16 h-16 text-lime-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-black">No Events Found</h3>
                  <p className="text-black/70 text-lg mb-8 leading-relaxed">
                    {selectedCategory 
                      ? "No events available in this category" 
                      : "No events are currently available"
                    }
                  </p>
                  {selectedCategory && (
                    <Button 
                      onClick={handleShowAllEvents} 
                      className="rounded-full px-10 py-4 bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-black font-semibold shadow-lg shadow-lime-200 hover:shadow-xl hover:shadow-lime-300 transition-all duration-500"
                    >
                      <Sparkles className="w-5 h-5 mr-3" />
                      View All Events
                    </Button>
                  )}
                </div>
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

      {/* Premium Glass UI Floating Tickets Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom duration-1000 delay-1000">
        
        
        {/* Enhanced Tooltip */}
        
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-lime-500 to-yellow-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl scale-110 -z-10"></div>
      </div>
    </div>
  );
}
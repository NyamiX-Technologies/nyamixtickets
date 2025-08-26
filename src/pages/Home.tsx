import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EventCard } from '@/components/EventCard';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { FloatingTicketCounter } from '@/components/FloatingTicketCounter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { Event, Category, eventService } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(0);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [eventsData, categoriesData] = await Promise.all([
        eventService.getHomeEvents(),
        eventService.getCategories()
      ]);
      
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Failed to load events",
        description: "Please refresh the page to try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvents(false);
      setIsLoadingCategories(false);
    }
  };

  const loadCategoryEvents = async (categoryId: string) => {
    setIsLoadingEvents(true);
    setSelectedCategory(categoryId);
    
    try {
      const categoryEvents = await eventService.getEventsByCategory(categoryId);
      setEvents(categoryEvents);
    } catch (error) {
      console.error('Failed to load category events:', error);
      toast({
        title: "Failed to load category events",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleShowAllEvents = async () => {
    setSelectedCategory(null);
    setIsLoadingEvents(true);
    
    try {
      const allEvents = await eventService.getHomeEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load all events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleTicketPurchased = () => {
    setTicketCount(prev => prev + 1);
  };

  const handleTicketCounterClick = () => {
    navigate('/tickets');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="nyamix-hero-gradient py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Discover Amazing
              <span className="block nyamix-gradient-overlay bg-clip-text text-transparent">
                Events
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Book tickets for concerts, festivals, conferences, and more. 
              Experience unforgettable moments with NyamiX.
            </p>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <Button size="lg" className="nyamix-button-primary">
                <Sparkles className="mr-2 h-5 w-5" />
                Browse Events
              </Button>
              <Button variant="outline" size="lg">
                <TrendingUp className="mr-2 h-5 w-5" />
                Trending Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">Browse by Category</h2>
            
            {isLoadingCategories ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-32 rounded-full flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  className={selectedCategory === null ? "nyamix-button-primary" : ""}
                  onClick={handleShowAllEvents}
                >
                  All Events
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={selectedCategory === category.id ? "nyamix-button-primary" : ""}
                    onClick={() => loadCategoryEvents(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name || 'Category Events'
                : 'Featured Events'
              }
            </h2>
            <Badge variant="outline" className="text-sm">
              {events.length} {events.length === 1 ? 'event' : 'events'} found
            </Badge>
          </div>

          {isLoadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <EventCard
                    event={event}
                    onClick={handleEventClick}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="max-w-md mx-auto">
                <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedCategory 
                    ? "No events available in this category at the moment."
                    : "No events available at the moment. Check back soon!"
                  }
                </p>
                {selectedCategory && (
                  <Button onClick={handleShowAllEvents} variant="outline">
                    View All Events
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onTicketPurchased={handleTicketPurchased}
      />

      {/* Floating Ticket Counter */}
      <FloatingTicketCounter
        ticketCount={ticketCount}
        onClick={handleTicketCounterClick}
      />
    </div>
  );
}
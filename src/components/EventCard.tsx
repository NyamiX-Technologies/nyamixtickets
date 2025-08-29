import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Clock, ArrowRight, Ticket } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/api';
import { Event, TicketType, Category } from '@/lib/events';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  event: Event;
}

// Utility function to format price with K notation
const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `${(price / 1000).toFixed(1)}K`.replace('.0K', 'K');
  }
  return price.toString();
};

// Get availability status
const getAvailabilityStatus = (ticketTypes: TicketType[]) => {
  const totalAvailable = ticketTypes.reduce((sum, ticket) => sum + ticket.quantity_available, 0);
  
  if (totalAvailable === 0) return { status: 'sold-out', text: 'Sold Out' };
  if (totalAvailable < 20) return { status: 'limited', text: 'Few Left' };
  return { status: 'available', text: 'Available' };
};

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const eventDate = new Date(event.date);
  
  // Calculate price range from ticket types
  const prices = event.ticket_types.map(t => parseFloat(t.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const priceDisplay = minPrice === maxPrice 
    ? `K${formatPrice(minPrice)}` 
    : `K${formatPrice(minPrice)} - K${formatPrice(maxPrice)}`;

  const availability = getAvailabilityStatus(event.ticket_types);

  // Format date properly
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = eventDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });

  const handleClick = () => {
    navigate(`/events/${event.id}`, { state: { event } });
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="group h-full"
    >
      <Card 
        className="overflow-hidden cursor-pointer h-full border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl bg-card flex flex-col"
        onClick={handleClick}
      >
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={`${IMAGE_BASE_URL}${event.image}`}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Only Category Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-secondary text-secondary-foreground text-xs px-2 py-1 backdrop-blur-sm border border-border/50">
              {event.category.name}
            </Badge>
          </div>

          {/* Availability Status - Only if limited or sold out */}
          {availability.status !== 'available' && (
            <div className="absolute top-3 left-3">
              <Badge 
                variant={availability.status === 'sold-out' ? 'destructive' : 'secondary'}
                className="text-xs px-2 py-1 backdrop-blur-sm"
              >
                {availability.text}
              </Badge>
            </div>
          )}
        </div>

        {/* Event Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <CalendarDays className="h-4 w-4" />
            <span>{formattedDate}</span>
            <span className="text-muted-foreground/50">•</span>
            <Clock className="h-4 w-4" />
            <span>{formattedTime}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg leading-tight text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          <div className="mt-auto">
            {/* Price Range */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg text-foreground">{priceDisplay}</span>
              </div>
              
              {event.age_restriction && (
                <Badge variant="outline" className="text-xs">
                  {event.age_restriction}+
                </Badge>
              )}
            </div>

            {/* Action Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="w-full group/btn font-semibold"
              disabled={availability.status === 'sold-out'}
              variant={availability.status === 'sold-out' ? 'secondary' : 'default'}
              size="lg"
            >
              <div className="flex items-center justify-center gap-2">
                {availability.status === 'sold-out' ? (
                  'Sold Out'
                ) : (
                  <>
                    <Ticket className="h-4 w-4" />
                    <span>Get Tickets</span>
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
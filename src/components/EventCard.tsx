import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Event } from '@/lib/events';
import { IMAGE_BASE_URL } from '@/lib/api';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const eventDate = new Date(event.date);
  const minPrice = event.price_range?.min || Math.min(...event.ticket_types.map(t => t.price));
  const maxPrice = event.price_range?.max || Math.max(...event.ticket_types.map(t => t.price));
  
  const priceDisplay = minPrice === maxPrice 
    ? `$${minPrice}` 
    : `$${minPrice} - $${maxPrice}`;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="nyamix-card nyamix-card-hover overflow-hidden cursor-pointer">
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={`${IMAGE_BASE_URL}${event.image}`}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <Badge 
              variant="secondary" 
              className="bg-primary text-primary-foreground font-medium"
            >
              {event.category.name}
            </Badge>
          </div>

          {/* Price Badge */}
          <div className="absolute top-4 right-4">
            <Badge 
              variant="outline" 
              className="bg-black/40 text-white border-white/20 backdrop-blur-sm"
            >
              {priceDisplay}
            </Badge>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-6">
          <h3 className="font-bold text-xl mb-2 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {event.short_description || event.description}
          </p>

          {/* Event Meta */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-2 text-primary" />
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              {event.location}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2 text-primary" />
              {event.ticket_types.length} ticket {event.ticket_types.length === 1 ? 'type' : 'types'}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClick(event);
            }}
            className="w-full nyamix-button-primary group-hover:shadow-lg"
          >
            Book Tickets
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
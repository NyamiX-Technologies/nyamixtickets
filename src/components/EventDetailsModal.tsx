import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, MapPin, Users, Clock, X, Minus, Plus } from 'lucide-react';
import { Event, TicketType, eventService } from '@/lib/events';
import { IMAGE_BASE_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface EventDetailsModalProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
  onTicketPurchased: () => void;
}

export function EventDetailsModal({ event, open, onClose, onTicketPurchased }: EventDetailsModalProps) {
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!event) return null;

  const eventDate = new Date(event.date);
  const totalPrice = selectedTicketType ? selectedTicketType.price * quantity : 0;

  const handleQuantityChange = (increment: boolean) => {
    if (!selectedTicketType) return;
    
    const newQuantity = increment ? quantity + 1 : quantity - 1;
    const maxQuantity = Math.min(selectedTicketType.available_quantity, 10);
    
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handlePurchase = async () => {
    if (!authService.isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase tickets",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!selectedTicketType || !phone.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a ticket type and enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Purchase ticket
      const purchaseResult = await eventService.purchaseTicket({
        ticket_type_id: selectedTicketType.id,
        quantity,
        payment_method: 'mobile_money'
      });

      // Step 2: Initiate mobile money payment
      await eventService.requestMobileMoneyPayment({
        phone: phone.trim(),
        amount: totalPrice,
        ticketId: purchaseResult.id
      });

      toast({
        title: "Payment initiated!",
        description: `Mobile money payment request sent to ${phone}. Please complete the payment on your phone.`,
      });

      onTicketPurchased();
      onClose();
      
      // Reset form
      setSelectedTicketType(null);
      setQuantity(1);
      setPhone('');
      
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{event.title}</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Event Image */}
          <div className="relative h-64 -mt-6 -mx-6 mb-6">
            <img
              src={`${IMAGE_BASE_URL}${event.image}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/40 text-white hover:bg-black/60"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-4 left-6">
              <Badge className="mb-2">{event.category.name}</Badge>
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center text-sm">
                <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                {eventDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {event.location}
              </div>
            </div>

            <p className="text-muted-foreground">{event.description}</p>

            {/* Ticket Selection */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Select Tickets</h3>
              
              <div className="space-y-3">
                <Label>Ticket Type</Label>
                <Select 
                  value={selectedTicketType?.id || ''} 
                  onValueChange={(value) => {
                    const ticketType = event.ticket_types.find(t => t.id === value);
                    setSelectedTicketType(ticketType || null);
                    setQuantity(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.ticket_types.map((ticketType) => (
                      <SelectItem key={ticketType.id} value={ticketType.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{ticketType.name}</span>
                          <div className="ml-4 text-right">
                            <div className="font-medium">${ticketType.price}</div>
                            <div className="text-xs text-muted-foreground">
                              {ticketType.available_quantity} available
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTicketType && (
                <>
                  <div className="space-y-3">
                    <Label>Quantity</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(false)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-medium min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(true)}
                        disabled={quantity >= Math.min(selectedTicketType.available_quantity, 10)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone">Phone Number (for payment)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={isLoading || !phone.trim()}
                    className="w-full nyamix-button-primary"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                        Processing...
                      </div>
                    ) : (
                      `Purchase ${quantity} ${quantity === 1 ? 'Ticket' : 'Tickets'} - $${totalPrice}`
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
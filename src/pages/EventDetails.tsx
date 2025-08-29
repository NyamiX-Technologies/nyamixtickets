import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, MapPin, Users, Clock, X, Minus, Plus, ShoppingCart, CreditCard, Smartphone, Star, AlertCircle, CheckCircle2, Ticket, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/api';
import { Event, TicketType, eventService } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

// Circular Progress Component for Ticket Availability
const CircularProgress = ({ value, max, size = 40, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColorByPercentage = (percent: number) => {
    if (percent > 70) return 'text-green-500';
    if (percent > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-500 ease-out ${getColorByPercentage(percentage)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${getColorByPercentage(percentage)}`}>
          {value}
        </span>
      </div>
    </div>
  );
};

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Fetch event data if not passed in location state
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || event) return;
      
      setLoading(true);
      try {
        // First try to get from home events
        const events = await eventService.getHomeEvents();
        const foundEvent = events.find(e => e.id.toString() === eventId);
        
        if (foundEvent) {
          setEvent(foundEvent);
          if (foundEvent.ticket_types?.length > 0) {
            setSelectedTicketType(foundEvent.ticket_types[0]);
          }
        } else {
          throw new Error('Event not found');
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, event]);

  // Calculate total price
  const totalPrice = useCallback(() => {
    if (!selectedTicketType) return 0;
    return Number(selectedTicketType.price) * quantity;
  }, [selectedTicketType, quantity]);

  // Handle quantity change
  const handleQuantityChange = useCallback((increment: boolean) => {
    setQuantity(prev => {
      if (increment) {
        return Math.min(prev + 1, selectedTicketType?.quantity_available || 10, 10);
      } else {
        return Math.max(prev - 1, 1);
      }
    });
  }, [selectedTicketType]);

  // Handle ticket type change
  const handleTicketTypeChange = useCallback((value: string) => {
    const ticket = event?.ticket_types.find(t => t.id.toString() === value);
    setSelectedTicketType(ticket || null);
    setQuantity(1);
  }, [event]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
      
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required.';
      } else if (!/^(9[5-7]|7[6-7])\d{8}$/.test(phone.trim())) {
        newErrors.phone = 'Please enter a valid 10-digit Zambian mobile number.';
      }
      
      if (!selectedTicketType) {
        newErrors.ticketType = 'Please select a ticket type';
      }

    return newErrors;
  }, [phone, selectedTicketType]);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!event || !selectedTicketType) return;

    setErrors({});
    setIsProcessingPayment(true);
    setPaymentStatus('processing');

    try {
      // Check authentication first
     

      //
       const ticketResult = await eventService.purchaseTicket(
        selectedTicketType.id.toString(),
        quantity
      );

      // Process payment
      const paymentData = {
        phone: phone.startsWith('0') ? `+260${phone.substring(1)}` : phone,
        amount: totalPrice(),
        ticketId: ticketResult.id,  
      };

      // Initiate payment
      await eventService.requestMobileMoneyPayment(paymentData);
      
      // Show success state
      setPaymentStatus('success');
      toast({
        title: "Payment initiated",
        description: "Please check your phone to complete the payment",
        variant: "default",
      });

      // Reset form after successful payment
      setTimeout(() => {
        setPaymentStatus('idle');
        setPhone('');
        setQuantity(1);
        navigate('/tickets');
      }, 3000);

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [event, selectedTicketType, phone, quantity, isAuthenticated, totalPrice, navigate, toast, validateForm]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or may have been removed.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(event.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const maxQuantity = selectedTicketType?.quantity_available || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back to Events</span>
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Image and Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border/50">
              <div className="aspect-video bg-muted relative">
                {event.image ? (
                  <img 
                    src={`${event.image.startsWith('http') ? '' : IMAGE_BASE_URL}${event.image}`} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Ticket className="h-16 w-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-background/90 backdrop-blur-sm text-foreground hover:bg-background/80">
                    {event.category?.name || 'Event'}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{event.title}</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="prose max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line">{event.description}</p>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-bold mb-4">Event Details</h2>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-muted-foreground">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CalendarDays className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Date & Time</h3>
                    <p className="text-muted-foreground">
                      {formattedDate} • {formattedTime}
                    </p>
                  </div>
                </div>
                {event.age_restriction > 0 && (
                  <div className="flex items-start gap-4">
                    <Info className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-medium">Age Restriction</h3>
                      <p className="text-muted-foreground">Ages {event.age_restriction}+ only</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Purchase */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Get Tickets</h2>

              <div className="space-y-6">
                {/* Ticket Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="ticket-type" className="text-lg font-semibold flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Select Ticket Type
                  </Label>
                  <Select 
                    value={selectedTicketType?.id.toString() || ''} 
                    onValueChange={handleTicketTypeChange}
                    disabled={isProcessingPayment}
                  >
                    <SelectTrigger 
                      id="ticket-type" 
                      className="h-14 text-base rounded-xl border-2 border-border/50 focus-visible:ring-primary"
                    >
                      <SelectValue placeholder="Select a ticket type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {event.ticket_types?.map((ticket) => (
                        <SelectItem 
                          key={ticket.id} 
                          value={ticket.id.toString()}
                          className="flex justify-between items-center py-3"
                        >
                          <div className="flex flex-col">
                            <span>{ticket.name}</span>
                            {ticket.quantity_available > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {ticket.quantity_available} available
                              </span>
                            ) : (
                              <span className="text-xs text-destructive">
                                Sold out
                              </span>
                            )}
                          </div>
                          <span className="ml-4 font-medium">K{parseFloat(ticket.price).toFixed(2)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity Selector */}
                {selectedTicketType && selectedTicketType.quantity_available > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Quantity
                    </Label>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(false)}
                        disabled={quantity <= 1 || isProcessingPayment}
                        className="h-12 w-12 rounded-full border-2 hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-md"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <div className="text-2xl font-bold w-12 text-center">
                        {quantity}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(true)}
                        disabled={quantity >= Math.min(maxQuantity, 10) || isProcessingPayment}
                        className="h-12 w-12 rounded-full border-2 hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-md"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Max {Math.min(maxQuantity, 10)} per order
                    </p>
                  </div>
                )}

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-lg font-semibold flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground">+260</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., 961234567 (MTN) or 971234567 (Airtel)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                      disabled={isProcessingPayment}
                      className={`h-14 text-base pl-16 rounded-xl border-2 transition-all duration-200 ${
                        errors.phone ? 'border-destructive focus-visible:ring-destructive' : 'border-border/50 focus-visible:border-primary'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h3 className="font-semibold mb-3 text-foreground">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Ticket Type:</span>
                      <span className="font-medium text-right">
                        {selectedTicketType ? selectedTicketType.name : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price per ticket:</span>
                      <span className="font-medium">
                        {selectedTicketType ? `K${parseFloat(selectedTicketType.price).toFixed(2)}` : 'K0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        K{totalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <Button
                  onClick={handlePurchase}
                  disabled={!selectedTicketType || !phone.trim() || isProcessingPayment || maxQuantity === 0}
                  className={`w-full h-14 text-lg font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    !selectedTicketType || !phone.trim() || maxQuantity === 0 ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  size="lg"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </div>
                  ) : paymentStatus === 'success' ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Payment Initiated
                    </div>
                  ) : maxQuantity === 0 ? (
                    'Sold Out'
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Pay K{totalPrice().toFixed(2)}
                      <Star className="h-4 w-4 ml-1 animate-pulse" />
                    </div>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center px-2">
                  By purchasing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
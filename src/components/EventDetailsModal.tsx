import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, MapPin, Users, Clock, X, Minus, Plus, ShoppingCart, CreditCard, Smartphone, Star, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
import { IMAGE_BASE_URL } from '@/lib/api';
import { Event, TicketType, Category } from '@/lib/events';

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

export function EventDetailsModal({ event, open, onClose, onTicketPurchased }: EventDetailsModalProps) {
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset state when modal opens/closes or event changes
  useEffect(() => {
    if (open && event) {
      setSelectedTicketType(null);
      setQuantity(1);
      setPhone('');
      setErrors({});
    }
  }, [open, event]);

  // Memoized calculations
  const eventDetails = event ? {
    date: new Date(event.date),
    totalPrice: selectedTicketType ? parseFloat(selectedTicketType.price) * quantity : 0,
    maxQuantity: selectedTicketType ? selectedTicketType.quantity_available : 0,
  } : null;

  const formattedTime = eventDetails?.date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  const formattedDate = eventDetails?.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!selectedTicketType) {
      newErrors.ticketType = 'Please select a ticket type';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+?260|0)[1-9]\d{8}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid Zambian phone number';
    }

    // Only validate quantity if a ticket type is selected and event details are available
    if (selectedTicketType && eventDetails) {
      if (quantity < 1 || quantity > eventDetails.maxQuantity) {
        newErrors.quantity = `Quantity must be between 1 and ${eventDetails.maxQuantity}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedTicketType, phone, quantity, eventDetails]);

  const handleQuantityChange = useCallback((increment: boolean) => {
    if (!selectedTicketType || !eventDetails) return;
    
    const newQuantity = increment ? quantity + 1 : quantity - 1;
    
    if (newQuantity >= 1 && newQuantity <= eventDetails.maxQuantity) {
      setQuantity(newQuantity);
      // Clear quantity error if it exists
      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: '' }));
      }
    }
  }, [quantity, selectedTicketType, eventDetails, errors.quantity]);

  const handleTicketTypeChange = useCallback((value: string) => {
    const ticketType = event?.ticket_types.find(t => t.id.toString() === value);
    setSelectedTicketType(ticketType || null);
    setQuantity(1);
    // Clear related errors
    setErrors(prev => ({ ...prev, ticketType: '', quantity: '' }));
  }, [event?.ticket_types]);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    // Clear phone error if it exists
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  }, [errors.phone]);

  const handlePurchase = async () => {
    if (!validateForm() || !event || !selectedTicketType || !eventDetails) return;

    setIsLoading(true);
    
    try {
      // Mock purchase logic - replace with your actual API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      alert(`Payment initiated for ZMW${eventDetails.totalPrice.toFixed(2)} to ${phone}`);
      
      onTicketPurchased();
      onClose();
      
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityStatus = (available: number, total: number = 100) => {
    const percentage = (available / total) * 100;
    if (available === 0) return { text: 'Sold Out', color: 'destructive', icon: AlertCircle };
    if (percentage <= 20) return { text: 'Almost Gone', color: 'destructive', icon: AlertCircle };
    if (percentage <= 50) return { text: 'Limited', color: 'warning', icon: AlertCircle };
    return { text: 'Available', color: 'success', icon: CheckCircle2 };
  };

  if (!event || !eventDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-background via-background to-muted/20">
        <DialogHeader className="sr-only">
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col lg:flex-row h-full max-h-[95vh] overflow-hidden"
            >
              {/* Hero Image Section */}
              <div className="relative h-96 lg:h-auto lg:w-2/5 flex-shrink-0 overflow-hidden">
                <motion.img
                  src={`${IMAGE_BASE_URL}${event.image}`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-6 right-6 bg-black/60 text-white hover:bg-black/80 rounded-full backdrop-blur-md transition-all duration-300 z-10 shadow-lg border border-white/20"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Age Restriction Badge */}
                {event.age_restriction && (
                  <div className="absolute top-6 left-6 z-10">
                    <Badge className="bg-orange-500/90 text-white text-sm px-3 py-1 rounded-full shadow-lg backdrop-blur-sm border border-orange-400/50">
                      {event.age_restriction}+ Only
                    </Badge>
                  </div>
                )}

                {/* Event Header Info */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Badge className="mb-4 bg-primary/90 text-primary-foreground text-sm px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-primary/50">
                      {event.category.name}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-2xl mb-4">
                      {event.title}
                    </h1>
                    <div className="flex flex-col gap-3 text-white/90">
                      <div className="flex items-center">
                        <CalendarDays className="h-5 w-5 mr-3 text-primary" />
                        <span className="text-base font-medium">
                          {formattedDate} at {formattedTime}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-primary" />
                        <span className="text-base font-medium">{event.location}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 lg:w-3/5 overflow-hidden bg-gradient-to-br from-background to-muted/10">
                <div className="h-full overflow-y-auto p-8 lg:p-10 space-y-10">
                  {/* Event Details */}
                  <motion.section
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-primary rounded-full"></div>
                      <h2 className="text-2xl font-bold text-foreground">Event Details</h2>
                    </div>
                    
                    <p className="text-foreground/80 text-lg leading-relaxed bg-card/40 p-6 rounded-2xl border border-border/50 backdrop-blur-sm">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">Age Restriction</span>
                        </div>
                        <span className="text-xl font-bold">{event.age_restriction}+ Only</span>
                      </div>
                      <div className="bg-card/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">Price Range</span>
                        </div>
                        <span className="text-xl font-bold">From K{event.price_range}</span>
                      </div>
                    </div>
                  </motion.section>

                  <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

                  {/* Ticket Purchase Section */}
                  <motion.section
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-primary rounded-full"></div>
                      <h2 className="text-2xl font-bold text-foreground">Purchase Tickets</h2>
                      <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                        Secure Payment
                      </Badge>
                    </div>
                    
                    <div className="bg-gradient-to-br from-card/60 to-card/40 rounded-2xl p-8 space-y-8 border border-border/50 backdrop-blur-sm shadow-lg">
                      {/* Ticket Type Selection */}
                      <div className="space-y-4">
                        <Label htmlFor="ticket-type" className="text-lg font-semibold flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          Select Ticket Type *
                        </Label>
                        <Select 
                          value={selectedTicketType?.id.toString() || ''} 
                          onValueChange={handleTicketTypeChange}
                        >
                          <SelectTrigger 
                            id="ticket-type" 
                            className={`h-14 text-base rounded-xl border-2 transition-all duration-200 ${errors.ticketType ? 'border-destructive focus:ring-destructive' : 'border-border/50 focus:border-primary'}`}
                          >
                            <SelectValue placeholder="Choose your ticket type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2 shadow-xl">
                            {event.ticket_types.map((ticketType) => {
                              const status = getAvailabilityStatus(ticketType.quantity_available);
                              const StatusIcon = status.icon;
                              
                              return (
                                <SelectItem 
                                  key={ticketType.id} 
                                  value={ticketType.id.toString()}
                                  className="py-6 text-base cursor-pointer rounded-lg m-1 transition-all duration-200 hover:bg-primary/5"
                                  disabled={ticketType.quantity_available === 0}
                                >
                                  <div className="flex justify-between items-center w-full pr-6">
                                    <div className="flex items-center gap-4">
                                      <CircularProgress 
                                        value={ticketType.quantity_available} 
                                        max={100} 
                                        size={48} 
                                        strokeWidth={4}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-bold text-lg">{ticketType.name}</span>
                                        <div className="flex items-center gap-2">
                                          <StatusIcon className={`h-4 w-4 ${
                                            status.color === 'destructive' ? 'text-red-500' :
                                            status.color === 'warning' ? 'text-yellow-500' :
                                            'text-green-500'
                                          }`} />
                                          <span className={`text-sm font-medium ${
                                            status.color === 'destructive' ? 'text-red-600' :
                                            status.color === 'warning' ? 'text-yellow-600' :
                                            'text-green-600'
                                          }`}>
                                            {status.text}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-2xl text-primary">
                                        K{parseFloat(ticketType.price).toFixed(0)}
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {ticketType.quantity_available} left
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {errors.ticketType && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-destructive flex items-center gap-2"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {errors.ticketType}
                          </motion.p>
                        )}
                      </div>

                      <AnimatePresence>
                        {selectedTicketType && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="space-y-8 overflow-hidden"
                          >
                            {/* Quantity Selection */}
                            <div className="space-y-4">
                              <Label htmlFor="quantity" className="text-lg font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Quantity (Max {eventDetails.maxQuantity})
                              </Label>
                              <div className="flex items-center justify-center gap-6">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(false)}
                                  disabled={quantity <= 1 || isLoading}
                                  className="h-14 w-14 rounded-full border-2 hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-md"
                                >
                                  <Minus className="h-6 w-6" />
                                </Button>
                                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl px-8 py-4 min-w-[100px] text-center shadow-inner">
                                  <span className="text-3xl font-bold text-primary">{quantity}</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(true)}
                                  disabled={quantity >= eventDetails.maxQuantity || isLoading}
                                  className="h-14 w-14 rounded-full border-2 hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-md"
                                >
                                  <Plus className="h-6 w-6" />
                                </Button>
                              </div>
                              {errors.quantity && (
                                <motion.p
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-sm text-destructive flex items-center justify-center gap-2"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  {errors.quantity}
                                </motion.p>
                              )}
                            </div>

                            {/* Phone Number Input */}
                            <div className="space-y-4">
                              <Label htmlFor="phone" className="text-lg font-semibold flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Phone Number (Mobile Money) *
                              </Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="e.g., +260971234567 or 0971234567"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className={`h-14 text-base rounded-xl border-2 transition-all duration-200 ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : 'border-border/50 focus-visible:border-primary'}`}
                              />
                              {errors.phone && (
                                <motion.p
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-sm text-destructive flex items-center gap-2"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  {errors.phone}
                                </motion.p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Purchase Summary */}
                    <AnimatePresence>
                      {selectedTicketType && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 border-2 border-primary/20 shadow-lg backdrop-blur-sm"
                        >
                          <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-primary-foreground" />
                            </div>
                            Order Summary
                          </h3>
                          <div className="space-y-4 text-base">
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Ticket Type:</span>
                              <span className="font-semibold">{selectedTicketType.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Price per ticket:</span>
                              <span className="font-semibold">K{parseFloat(selectedTicketType.price).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Quantity:</span>
                              <span className="font-semibold">{quantity}</span>
                            </div>
                            <Separator className="bg-gradient-to-r from-transparent via-primary/20 to-transparent my-4" />
                            <div className="flex justify-between items-center text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent py-2">
                              <span>Total:</span>
                              <span>ZMW{eventDetails.totalPrice.toFixed(2)}</span>
                            </div>
                          </div>

                          <Button
                            onClick={handlePurchase}
                            disabled={isLoading || !selectedTicketType || !phone.trim() || quantity === 0}
                            className="w-full mt-8 h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center gap-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-3 border-current border-t-transparent" />
                                Processing Payment...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <Smartphone className="h-6 w-6" />
                                Pay K{eventDetails.totalPrice.toFixed(2)} via Mobile Money
                                <Star className="h-5 w-5 ml-2 animate-pulse" />
                              </div>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
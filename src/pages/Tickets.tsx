import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, Ticket, CreditCard, RefreshCw, QrCode } from 'lucide-react';
import { Ticket as TicketType, eventService } from '@/lib/events';
import { IMAGE_BASE_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Tickets() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    loadUserTickets();
  }, [navigate]);

  const loadUserTickets = async () => {
    setIsLoading(true);
    
    try {
      const userTickets = await eventService.getUserTickets();
      setTickets(userTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast({
        title: "Failed to load tickets",
        description: "Please refresh the page to try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPayment = async (ticket: TicketType) => {
    setRetryingPayment(ticket.id);
    
    try {
      // In a real app, you might want to collect phone number again
      // For now, we'll show instructions to complete payment
      toast({
        title: "Payment retry initiated",
        description: "Please check your phone for the mobile money payment request",
      });
    } catch (error) {
      console.error('Failed to retry payment:', error);
      toast({
        title: "Payment retry failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setRetryingPayment(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'successful':
        return 'Payment Complete';
      case 'pending':
        return 'Payment Pending';
      case 'failed':
        return 'Payment Failed';
      default:
        return paymentStatus;
    }
  };

  if (!authService.isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Ticket className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">My Tickets</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your event tickets and view payment status
          </p>
        </motion.div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {tickets.map((ticket, index) => {
              const eventDate = new Date(ticket.event.date);
              const purchaseDate = new Date(ticket.purchase_date);
              
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="nyamix-card nyamix-card-hover overflow-hidden">
                    {/* Event Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={`${IMAGE_BASE_URL}${ticket.event.image}`}
                        alt={ticket.event.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge 
                          variant={getStatusBadgeVariant(ticket.payment_status)}
                          className="font-medium"
                        >
                          {getStatusText(ticket.payment_status)}
                        </Badge>
                      </div>

                      {/* Quantity Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge 
                          variant="outline" 
                          className="bg-black/40 text-white border-white/20 backdrop-blur-sm"
                        >
                          {ticket.quantity}x {ticket.ticket_type.name}
                        </Badge>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2 text-foreground line-clamp-2">
                        {ticket.event.title}
                      </h3>

                      {/* Event Meta */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                          {eventDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          {ticket.event.location}
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4 mr-2 text-primary" />
                          Total: ${ticket.total_price}
                        </div>
                      </div>

                      {/* Ticket Actions */}
                      <div className="space-y-3">
                        {ticket.payment_status === 'successful' && ticket.barcode_image ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // In a real app, this would show the barcode in a modal
                              toast({
                                title: "Ticket QR Code",
                                description: "Show this code at the event entrance",
                              });
                            }}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Show QR Code
                          </Button>
                        ) : ticket.payment_status === 'failed' ? (
                          <Button
                            onClick={() => handleRetryPayment(ticket)}
                            disabled={retryingPayment === ticket.id}
                            variant="destructive"
                            className="w-full"
                          >
                            {retryingPayment === ticket.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                Retrying...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Retry Payment
                              </div>
                            )}
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-center py-2">
                            Payment Processing...
                          </Badge>
                        )}
                      </div>

                      {/* Purchase Info */}
                      <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                        Purchased on {purchaseDate.toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="max-w-md mx-auto">
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any tickets yet. Explore our amazing events and book your first ticket!
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="nyamix-button-primary"
              >
                Browse Events
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, Ticket, CreditCard, RefreshCw, QrCode, User, Phone, Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Ticket as TicketType, eventService } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';




export default function Tickets() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  const openRetryModal = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setPhoneNumber(ticket.customer_phone || '');
    setRetryModalOpen(true);
  };

  const closeRetryModal = () => {
    setRetryModalOpen(false);
    setSelectedTicket(null);
    setPhoneNumber('');
    setIsProcessing(false);
  };

  const handleRetryPayment = async () => {
    if (!selectedTicket) return;
  
    setIsProcessing(true);
  
    try {
      // Ensure phone number starts with +260
      let normalizedPhone = phoneNumber.trim();
      if (!normalizedPhone.startsWith('+260')) {
        // Remove leading 0 if present, then add +260
        normalizedPhone = '+260' + normalizedPhone.replace(/^0+/, '');
      }
      const paymentData = {
        amount: parseFloat(selectedTicket.total_price),
        phone: normalizedPhone,
        ticketId: selectedTicket.id.toString()
      };
      const result = await eventService.requestMobileMoneyPayment(paymentData);
      

      closeRetryModal();
      toast({
        title: "Payment request sent",
        description: "Please check your phone to complete the payment and refresh page",
      });


  
      if (result.status === 'pay-offline' ) {
        
  
        // Refresh tickets to update status
       
       
      }
    } catch (error) {
      console.error('Failed to retry payment:', error);
      toast({
        title: "Payment retry failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'payment not processed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'successful':
        return 'Payment Complete';
      case 'pending':
        return 'Payment Pending';
      case 'failed':
        return 'Payment Failed';
      case 'payment not processed':
        return 'Payment Not Processed';
      default:
        return paymentStatus;
    }
  };

  if (!authService.isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Ticket className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Tickets</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage your event tickets and payment status
          </p>
        </motion.div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border border-gray-200 rounded-xl">
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
              const eventDate = new Date(ticket.event_date);
              const issuedDate = new Date(ticket.issued_at);
              const canShowQR = ticket.status === 'confirmed' && ticket.payment_status === 'successful';
              const canRetryPayment = ticket.payment_status === 'failed' || ticket.payment_status === 'Payment not processed';
              
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="overflow-hidden border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    {/* Event Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={ticket.event_image || '/placeholder-event.jpg'}
                        alt={ticket.event_title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Status Badges */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Badge 
                          variant={getStatusBadgeVariant(ticket.status)}
                          className="font-medium"
                        >
                          {getStatusText(ticket.status)}
                        </Badge>
                        <Badge 
                          variant={getPaymentStatusBadgeVariant(ticket.payment_status)}
                          className="font-medium"
                        >
                          {getPaymentStatusText(ticket.payment_status)}
                        </Badge>
                      </div>

                      {/* Ticket Info Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge 
                          variant="outline" 
                          className="bg-black/40 text-white border-white/20 backdrop-blur-sm"
                        >
                          {ticket.quantity}x {ticket.ticket_type_name}
                        </Badge>
                      </div>

                      {/* Ticket Number */}
                      <div className="absolute bottom-4 left-4">
                        <Badge 
                          variant="outline" 
                          className="bg-black/40 text-white border-white/20 backdrop-blur-sm font-mono text-xs"
                        >
                          #{ticket.ticket_number}
                        </Badge>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
                        {ticket.event_title}
                      </h3>

                      {/* Event Meta */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4 mr-2 text-blue-600" />
                          {eventDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          {ticket.event_location}
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                          K{ticket.total_price}
                        </div>
                      </div>

                      {/* Ticket Actions */}
                      <div className="space-y-3">
                        {canShowQR ? (
                          <Button
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              toast({
                                title: "Ticket QR Code",
                                description: `Show this code at the event entrance. Secret: ${ticket.secret_code}`,
                              });
                            }}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Show QR Code
                          </Button>
                        ) : canRetryPayment ? (
                          <Button
                            onClick={() => openRetryModal(ticket)}
                            variant="destructive"
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry Payment
                          </Button>
                        ) : ticket.payment_status === 'pending' ? (
                          <Badge variant="secondary" className="w-full justify-center py-2 bg-amber-100 text-amber-800">
                            Payment Processing...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-full justify-center py-2">
                            Ticket Issued
                          </Badge>
                        )}
                      </div>

                      {/* Issue Info */}
                      <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
                        <div>Issued on {issuedDate.toLocaleDateString()}</div>
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
              <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't purchased any tickets yet. Explore our events and book your first ticket!
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Events
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Payment Retry Modal */}
      <AnimatePresence>
        {retryModalOpen && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Retry Payment</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={closeRetryModal}
                  disabled={isProcessing}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">{selectedTicket.event_title}</h4>
                  <p className="text-blue-700">Amount: K{selectedTicket.total_price}</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Mobile Money Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isProcessing}
                    className="w-full"
                  />
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    You will receive a payment request on your phone. Please complete the transaction to confirm your ticket.
                  </p>
                </div>
                
                <Button
                  onClick={handleRetryPayment}
                  disabled={isProcessing || !phoneNumber}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Request Payment
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Ticket, CreditCard, RefreshCw, User, X, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { Ticket as TicketType, eventService } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import TicketDetailModal from '@/components/TicketDetailModal';

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function Tickets() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [ticketDetailModalOpen, setTicketDetailModalOpen] = useState(false);
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
      toast({ title: "Failed to load tickets", description: "Please refresh the page to try again", variant: "destructive" });
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
  
  const openTicketDetailModal = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setTicketDetailModalOpen(true);
  };

  const closeTicketDetailModal = () => {
    setTicketDetailModalOpen(false);
    setSelectedTicket(null);
  };

  const handleRetryPayment = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    try {
      let normalizedPhone = phoneNumber.trim();
      if (!normalizedPhone.startsWith('+260')) {
        normalizedPhone = '+260' + normalizedPhone.replace(/^0+/, '');
      }
      const paymentData = {
        amount: parseFloat(selectedTicket.total_price),
        phone: normalizedPhone,
        ticketId: selectedTicket.id.toString()
      };
      await eventService.requestMobileMoneyPayment(paymentData);
      closeRetryModal();
      toast({ title: "Payment request sent", description: "Please check your phone to complete the payment and refresh page" });
      setTimeout(loadUserTickets, 5000); // Refresh tickets after a delay
    } catch (error) {
      console.error('Failed to retry payment:', error);
      toast({ title: "Payment retry failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful': return 'default';
      case 'pending': return 'secondary';
      case 'failed':
      case 'payment not processed': return 'destructive';
      default: return 'outline';
    }
  };

  if (!authService.isAuthenticated()) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Ticket className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">My Tickets</h1>
            </div>
            <p className="text-gray-600 text-lg">Manage your event tickets and payment status</p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border border-gray-200 rounded-xl p-6"><Skeleton className="h-40 w-full mb-4" /><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-full" /></Card>
              ))}
            </div>
          ) : tickets.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {tickets.map((ticket, index) => {
                const canShowQR = ticket.status === 'confirmed' && ticket.payment_status === 'successful';
                const canRetryPayment = ticket.payment_status === 'failed' || ticket.payment_status === 'payment not processed';
                return (
                  <motion.div key={ticket.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                    <Card className="overflow-hidden border border-gray-200 rounded-xl hover:shadow-lg transition-shadow duration-300">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 pr-4">{ticket.event_title}</h3>
                          <Badge variant={getPaymentStatusBadgeVariant(ticket.payment_status)}>{ticket.payment_status}</Badge>
                        </div>
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                          <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />{formatDate(ticket.event_date)}</div>
                          <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />{ticket.event_location}</div>
                          <div className="flex items-center"><CreditCard className="h-4 w-4 mr-2 text-primary" />K{ticket.total_price} ({ticket.quantity}x {ticket.ticket_type_name})</div>
                        </div>
                        <div className="pt-4 border-t">
                          {canShowQR ? (
                            <Button className="w-full" onClick={() => openTicketDetailModal(ticket)}><QrCode className="mr-2 h-4 w-4" />View Ticket</Button>
                          ) : canRetryPayment ? (
                            <Button onClick={() => openRetryModal(ticket)} variant="destructive" className="w-full"><RefreshCw className="mr-2 h-4 w-4" />Retry Payment</Button>
                          ) : ticket.payment_status === 'pending' ? (
                            <Badge variant="secondary" className="w-full justify-center py-2 bg-amber-100 text-amber-800">Payment Processing...</Badge>
                          ) : (
                            <Badge variant="outline" className="w-full justify-center py-2">Ticket Issued</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="max-w-md mx-auto">
                <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h3>
                <p className="text-gray-500 mb-6">You haven't purchased any tickets yet. Explore our events and book your first ticket!</p>
                <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">Browse Events</Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Payment Retry Modal */}
      <AnimatePresence>
        {retryModalOpen && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Retry Payment</h3>
                <Button variant="ghost" size="icon" onClick={closeRetryModal} disabled={isProcessing}><X className="h-5 w-5" /></Button>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">{selectedTicket.event_title}</h4>
                  <p className="text-blue-700">Amount: K{selectedTicket.total_price}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">Mobile Money Phone Number</label>
                  <Input id="phone" type="tel" placeholder="Enter your phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isProcessing} className="w-full" />
                </div>
                <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">You will receive a payment request on your phone. Please complete the transaction.</p>
                </div>
                <Button onClick={handleRetryPayment} disabled={isProcessing || !phoneNumber} className="w-full bg-primary hover:bg-primary/90">
                  {isProcessing ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />Processing...</>) : (<><CheckCircle className="mr-2 h-4 w-4" />Request Payment</>)}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <TicketDetailModal ticket={selectedTicket as any} isOpen={ticketDetailModalOpen} onClose={closeTicketDetailModal} />
    </>
  );
}
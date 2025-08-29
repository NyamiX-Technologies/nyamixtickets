import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { eventService, Ticket } from '@/lib/events';
import { IMAGE_BASE_URL } from '@/lib/api';
import { Loader2, Ticket as TicketIcon, AlertCircle, RefreshCw, X, CreditCard, Smartphone, QrCode, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [ticketDetailModalOpen, setTicketDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
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

  const openRetryModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setPhoneNumber(ticket.customer_phone.startsWith('+260') ? ticket.customer_phone.substring(4) : ticket.customer_phone);
    setRetryModalOpen(true);
  };

  const handleRetryPayment = async () => {
    if (!selectedTicket || !phoneNumber) return;

    const phoneRegex = /^(9[5-7]|7[6-7])\d{7}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid 9-digit Zambian mobile number.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      await eventService.requestMobileMoneyPayment({
        phone: `+260${phoneNumber}`,
        amount: selectedTicket.total_price,
        ticketId: selectedTicket.id.toString(),
      });
      toast({ title: "Payment Initiated", description: "Please check your phone to complete the payment.", variant: "default" });
      setRetryModalOpen(false);
      loadUserTickets(); // Refresh tickets to update status
    } catch (error) { 
      console.error('Payment retry failed:', error);
      toast({ title: "Payment Failed", description: "Could not initiate payment. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTicketCard = (ticket: Ticket) => {
    console.log('Ticket Status:', ticket.payment_status);
    return (
    <div key={ticket.id} className="bg-card border border-border/50 rounded-[10px] shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02] duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 p-4 md:p-6 flex flex-col justify-center items-center bg-muted/30 border-b md:border-b-0 md:border-r border-border/50">
          {ticket.status === 'attended' ? (
            <div className="text-center p-4 border-2 border-dashed border-green-500/50 rounded-lg bg-green-500/5 w-full">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:h-16 text-green-500/80 mx-auto mb-3" />
              <h3 className="font-bold text-foreground">Event Attended</h3>
              <p className="text-sm text-muted-foreground">This ticket has already been used.</p>
            </div>
          ) : ticket.payment_status === 'successful' ? (
            <div className="text-center">
              <img src={`${IMAGE_BASE_URL}${ticket.barcode_image}`} alt="Ticket Barcode" className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-lg mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Scan at event entrance</p>
            </div>
          ) : (
            <div className="text-center p-4 border-2 border-dashed border-yellow-500/50 rounded-lg bg-yellow-500/5 w-full">
              <QrCode className="h-12 w-12 sm:h-16 sm:h-16 text-yellow-500/80 mx-auto mb-3" />
              <h3 className="font-bold text-foreground">Payment Required</h3>
              <p className="text-sm text-muted-foreground mb-4">Complete payment to reveal your barcode.</p>
              <Button size="sm" onClick={() => openRetryModal(ticket)} className="w-full">
                
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            </div>
          )}
          
        </div>
        <div className="md:col-span-2 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div className="flex-grow">
              <p className="text-sm font-medium text-primary">{ticket.ticket_type_name}</p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mt-1">{ticket.event_title}</h2>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0">
              <p className="text-base sm:text-lg font-bold">K{ticket.total_price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Qty: {ticket.quantity}</p>
            </div>
          </div>
          <div className="border-t border-border/50 my-4"></div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Date:</strong> {formatDate(ticket.event_date)}</p>
            <p><strong>Ticket No:</strong> {ticket.ticket_number}</p>
            <p><strong>Status:</strong> <span className={`font-semibold ${ticket.payment_status === 'successful' ? 'text-green-500' : 'text-yellow-500'}`}>{ticket.payment_status}</span></p>
          </div>
        </div>
      </div>
    </div>
  )};

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Tickets</h1>
          <Button variant="outline" onClick={loadUserTickets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="grid gap-6">
            {tickets.map(renderTicketCard)}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-border/50 rounded-2xl">
            <TicketIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">No Tickets Found</h2>
            <p className="text-muted-foreground mt-2">Your purchased tickets will appear here.</p>
          </div>
        )}
      </div>

      {/* Retry Payment Modal */}
      <Dialog open={retryModalOpen} onOpenChange={setRetryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
            <DialogDescription>
              Enter your mobile money number to finalize the payment for "{selectedTicket?.event_title}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-lg">K{selectedTicket?.total_price.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground">+260</span>
                </div>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                  className="pl-14 h-12"
                  placeholder="9..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRetryPayment} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
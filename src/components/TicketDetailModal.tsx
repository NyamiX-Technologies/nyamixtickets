import React from 'react';
import Barcode from 'react-barcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/lib/events';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, isOpen, onClose }) => {
  if (!ticket) return null;

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'success';
      case 'failed':
      case 'payment not processed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTicketStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">Ticket Details</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Event: {ticket.event_title}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-6 px-2">
          <div className="flex justify-center">
            <Barcode 
              value={ticket.secret_code} 
              width={2}
              height={80}
              format="CODE128"
              displayValue={true}
              fontOptions="bold"
              fontSize={16}
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Ticket Holder:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{ticket.customer_first_name} {ticket.customer_last_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Ticket Type:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{ticket.ticket_type_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Quantity:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{ticket.quantity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Payment Status:</span>
              <Badge variant={getPaymentStatusVariant(ticket.payment_status)} className="capitalize">{ticket.payment_status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Ticket Status:</span>
              <Badge variant={getTicketStatusVariant(ticket.status)} className="capitalize">{ticket.status}</Badge>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;

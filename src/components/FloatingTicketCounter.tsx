import { motion } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingTicketCounterProps {
  ticketCount: number;
  onClick: () => void;
}

export function FloatingTicketCounter({ ticketCount, onClick }: FloatingTicketCounterProps) {
  if (ticketCount === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="nyamix-floating-counter"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="flex items-center gap-2 text-foreground hover:bg-primary/10"
      >
        <ShoppingBag className="h-5 w-5" />
        <span className="font-medium">{ticketCount}</span>
        <span className="text-sm text-muted-foreground">
          {ticketCount === 1 ? 'ticket' : 'tickets'}
        </span>
      </Button>
    </motion.div>
  );
}
import { apiClient } from './api';

export interface Event {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  location: string;
  date: string;
  image: string;
  phone_number: string;
  ticket_type: string;
  ticket_types: TicketType[];
  category: Category;
  age_restriction: number;
  price_range: string;
}

export interface TicketType {
  id: number;
  name: string;
  price: string;
  quantity_available: number;
  event: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Ticket {
  id: number;
  barcode_token: string;
  ticket_number: string;
  payment_method: 'mobile_money' | 'credit_card' | string; 
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  barcode_image: string;
  secret_code: string;
  issued_at: string; 
  event_title: string;
  event_contact: string;
  ticket_type_name: string;
  ticket_price: string; 
  total_price: number;
  payment_status: 'pending' | 'successful' | 'failed' | 'Payment not processed' | string;
  event_image: string;
  event_date: string;
  event_description: string;
  event_location: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  customer_email: string;
  customer_avatar: string;
}

export interface PurchaseTicketData {
  ticket_type_id: string;
  quantity: number;
  payment_method: 'mobile_money';
}

export interface PaymentData {
  phone: string;
  amount: number;
  ticketId: string;
}

export const eventService = {
  async getHomeEvents(): Promise<Event[]> {
    return apiClient.get<Event[]>('/events/home-events/');
  },

  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/events/categories/');
  },

  async getEventsByCategory(categoryId: string): Promise<Event[]> {
    return apiClient.get<Event[]>(`/events/categories/${categoryId}/events/`);
  },

  async purchaseTicket(ticketTypeId: string, quantity: number,): Promise<{ id: string; total_price: number }> {
    const data = {
      ticket_type_id: ticketTypeId,
      quantity: quantity,
      payment_method: 'mobile_money',
    
    };
    return apiClient.post<{ id: string; total_price: number }>('/events/tickets/', data);
  },

  async requestMobileMoneyPayment(data: PaymentData): Promise<{ status: string }> {
    return apiClient.post<{ status: string }>('/payments/request-mobile-money-payment', data);
  },

  async getUserTickets(): Promise<Ticket[]> {
    return apiClient.get<Ticket[]>('/events/tickets/');
  }
};
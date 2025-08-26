import { apiClient } from './api';

export interface Event {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  location: string;
  date: string;
  image: string;
  ticket_types: TicketType[];
  category: Category;
  price_range?: {
    min: number;
    max: number;
  };
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  available_quantity: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Ticket {
  id: string;
  event: Event;
  ticket_type: TicketType;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: 'pending' | 'successful' | 'failed';
  barcode_image?: string;
  purchase_date: string;
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

  async purchaseTicket(data: PurchaseTicketData): Promise<{ id: string; total_price: number }> {
    return apiClient.post<{ id: string; total_price: number }>('/events/tickets/', data);
  },

  async requestMobileMoneyPayment(data: PaymentData): Promise<{ status: string }> {
    return apiClient.post<{ status: string }>('/payments/request-mobile-money-payment', data);
  },

  async getUserTickets(): Promise<Ticket[]> {
    return apiClient.get<Ticket[]>('/events/tickets/');
  }
};
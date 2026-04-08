import request from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface ConfirmPaymentRequest {
  sessionId: string;
}

export interface BookingUser {
  id: number;
  fullName: string;
  email: string;
}

export interface BookingSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: number;
  tutorId: number;
  learnerId: number;
  slotId: number;
  date: string;
  amountPaid: number;
  platformFee?: number;
  tutorEarning?: number;
  stripeSessionId?: string | null;
  meetLink?: string | null;
  paymentStatus?: string;
  paidAt?: string;
  createdAt: string;
  tutor?: { id: number; user?: BookingUser; [key: string]: unknown };
  learner?: { id: number; user?: BookingUser; [key: string]: unknown };
  slot: BookingSlot;
}

export async function createCheckoutSession(slotId: number): Promise<CheckoutSessionResponse> {
  const { data } = await request.post<CheckoutSessionResponse>('/bookings/create-checkout-session', {
    slotId,
  });
  return data;
}

export async function confirmPayment(payload: ConfirmPaymentRequest): Promise<Booking> {
  const { data } = await request.post<Booking>('/bookings/confirm-payment', payload);
  return data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await request.get<Booking[]>('/bookings');
  return data;
}

export interface EarningsBookingItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  amountPaid: number;
  platformFee: number;
  tutorEarning: number;
  learnerName: string;
  paidAt: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalPlatformFees: number;
  totalAmountPaid: number;
  platformFeePercent: number;
  totalBookings: number;
  bookings: EarningsBookingItem[];
}

export async function getTutorEarnings(): Promise<EarningsSummary> {
  const { data } = await request.get<EarningsSummary>('/tutor/earnings');
  return data;
}

export function useCreateCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (slotId: number) => createCheckoutSession(slotId),
  });
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['tutor'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-earnings'] });
    },
  });
}

export function useMyBookingsQuery() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: getMyBookings,
  });
}

export function useTutorEarningsQuery() {
  return useQuery({
    queryKey: ['tutor-earnings'],
    queryFn: getTutorEarnings,
  });
}


import request from '@/services/api';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { Tutor } from './types';

/** Category as returned by API (GET /tutors/categories and on tutor objects) */
export interface TutorCategoryApi {
  id: number;
  name: string;
  slug: string;
  /** Present on GET /tutors/categories */
  tutorCount?: number;
}

export interface WorkExperienceApi {
  id: number;
  tutorId: number;
  companyName: string;
  role: string;
  yearsWorked: number;
  createdAt: string;
}

export interface TutorUserApi {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

/** Slot shape from GET /tutor/slots, GET /tutors/:id, etc. */
export interface SlotApi {
  id: number;
  tutorId: number;
  /** Calendar day: `YYYY-MM-DD` or ISO like `2026-04-03T00:00:00.000Z` */
  date: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
  /** From GET /tutor/slots (and tutor profile with date filter): `true` if a learner has booked this slot */
  booked?: boolean;
}

/** Review from GET /tutors/:id (included on tutor) or POST /tutors/:id/reviews */
export interface Review {
  id: number;
  tutorId: number;
  learnerId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  learner: {
    user: {
      id: number;
      fullName: string;
    };
  };
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface TutorApi {
  id: number;
  about: string;
  bio: string;
  costPer30Min: number;
  profileImage: string | null;
  certificate: string | null;
  category: TutorCategoryApi | null;
  rating: number | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user: TutorUserApi;
  workExperiences: WorkExperienceApi[];
  slots?: SlotApi[];
  reviews?: Review[];
}

/** Query params for GET /tutors — e.g. ?search=john&categoryIds=1&minPrice=1&maxPrice=1&minRating=1 */
export interface TutorsListFilters {
  search?: string;
  categoryIds?: string; // comma-separated, e.g. "1,2,3"
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export async function getTutors(filters?: TutorsListFilters): Promise<TutorApi[]> {
  const params: Record<string, string | number> = {};
  if (filters?.search?.trim()) params.search = filters.search.trim();
  if (filters?.categoryIds) params.categoryIds = filters.categoryIds;
  if (filters?.minPrice != null) params.minPrice = filters.minPrice;
  if (filters?.maxPrice != null) params.maxPrice = filters.maxPrice;
  if (filters?.minRating != null) params.minRating = filters.minRating;
  const { data } = await request.get<TutorApi[]>('/tutors', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return data;
}

export async function getTutorCategories(): Promise<TutorCategoryApi[]> {
  const { data } = await request.get<TutorCategoryApi[]>('/tutors/categories');
  return data;
}

export async function getTutorById(id: string, date?: string): Promise<TutorApi> {
  const params = date ? { date } : undefined;
  try {
    const { data } = await request.get<TutorApi>(`/tutors/${id}`, { params });
    return data;
  } catch (e) {
    if (!date) {
      const list = await getTutors();
      const found = list.find((t) => String(t.id) === id);
      if (found) return found;
    }
    throw e;
  }
}

export async function getTutorReviews(tutorId: number): Promise<Review[]> {
  const { data } = await request.get<Review[]>(`/tutors/${tutorId}/reviews`);
  return data;
}

export async function createTutorReview(tutorId: number, payload: CreateReviewRequest): Promise<Review> {
  const { data } = await request.post<Review>(`/tutors/${tutorId}/reviews`, payload);
  return data;
}

export function useTutorQuery(id: string | undefined, date?: string) {
  return useQuery({
    queryKey: ['tutor', id, date],
    queryFn: () => getTutorById(id!, date),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

// --- Booking ---

/** Session date comes from the slot; body is only slotId */
export interface CreateBookingPayload {
  slotId: number;
}

export async function createBooking(payload: CreateBookingPayload): Promise<unknown> {
  const { data } = await request.post('/bookings', payload);
  return data;
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['tutor'] });
    },
  });
}

/** Map API tutor to UI Tutor (pricePerHour = costPer30Min * 2, rating/reviewCount defaulted). */
export function mapTutorApiToTutor(t: TutorApi): Tutor {
  const reviews = t.reviews ?? [];
  return {
    id: String(t.id),
    fullName: t.user.fullName,
    category: t.category ?? null,
    rating: t.rating ?? 0,
    reviewCount: reviews.length,
    pricePerHour: (t.costPer30Min ?? 0) * 2,
    bio: t.bio || t.about || '',
    // Certified should be based on whether tutor uploaded a certificate (not on admin approval flag).
    certified: !!t.certificate,
    profileImage: t.profileImage,
  };
}

export const TUTORS_QUERY_KEY = ['tutors'] as const;

export function useCreateTutorReviewMutation(tutorId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewRequest) => createTutorReview(Number(tutorId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor', tutorId] });
      queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useTutorsQuery(filters?: TutorsListFilters) {
  return useQuery({
    queryKey: [...TUTORS_QUERY_KEY, filters],
    queryFn: async () => {
      const list = await getTutors(filters);
      return list.map(mapTutorApiToTutor);
    },
  });
}

export const TUTOR_CATEGORIES_QUERY_KEY = ['tutors', 'categories'] as const;

export function useTutorCategoriesQuery() {
  return useQuery({
    queryKey: TUTOR_CATEGORIES_QUERY_KEY,
    queryFn: getTutorCategories,
  });
}

// --- Current user (tutor) profile upload & update ---

export interface WorkExperienceInput {
  companyName: string;
  role: string;
  yearsWorked: number;
}

export interface TutorProfileUpdatePayload {
  about?: string;
  bio?: string;
  costPer30Min?: number;
  profileImage?: string | null;
  certificate?: string | null;
  categoryId?: number | null;
  rating?: number | null;
  phone?: string;
  workExperiences?: WorkExperienceInput[];
}

/** POST /tutor/upload — upload profile image and/or certificate; backend sets URLs on logged-in tutor. */
export async function uploadTutorFiles(profileImage?: File | null, certificate?: File | null): Promise<void> {
  if (!profileImage && !certificate) return;
  const formData = new FormData();
  if (profileImage) formData.append('profileImage', profileImage);
  if (certificate) formData.append('certificate', certificate);
  await request.post('/tutor/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** PATCH /tutor/profile — update logged-in tutor profile. */
export async function updateTutorProfile(payload: TutorProfileUpdatePayload): Promise<unknown> {
  const { data } = await request.patch('/tutor/profile', payload);
  return data;
}

export function useUploadTutorFilesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileImage, certificate }: { profileImage?: File | null; certificate?: File | null }) =>
      uploadTutorFiles(profileImage, certificate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });
    },
  });
}

export function useUpdateTutorProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTutorProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });
    },
  });
}

// --- Tutor slots (current user) ---

export interface TutorSlotInput {
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
}

/** Logged-in tutor's slots; backend may include `booked` per slot for dashboard use. */
export async function getTutorSlots(): Promise<SlotApi[]> {
  const { data } = await request.get<SlotApi[]>('/tutor/slots');
  return data;
}

export async function createTutorSlot(payload: TutorSlotInput): Promise<SlotApi> {
  const { data } = await request.post<SlotApi>('/tutor/slots', payload);
  return data;
}

export async function updateTutorSlot(id: number, payload: TutorSlotInput): Promise<SlotApi> {
  const { data } = await request.patch<SlotApi>(`/tutor/slots/${id}`, payload);
  return data;
}

export async function deleteTutorSlot(id: number): Promise<void> {
  await request.delete(`/tutor/slots/${id}`);
}

const TUTOR_SLOTS_QUERY_KEY = ['tutor', 'slots'] as const;

export function useTutorSlotsQuery() {
  return useQuery({
    queryKey: TUTOR_SLOTS_QUERY_KEY,
    queryFn: getTutorSlots,
  });
}

export function useCreateTutorSlotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTutorSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TUTOR_SLOTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });
    },
  });
}

export function useUpdateTutorSlotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TutorSlotInput }) => updateTutorSlot(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TUTOR_SLOTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });
    },
  });
}

export function useDeleteTutorSlotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTutorSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TUTOR_SLOTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });
    },
  });
}

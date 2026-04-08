import { createSlice } from '@reduxjs/toolkit';

export interface WorkExperience {
  id: number;
  tutorId: number;
  companyName: string;
  role: string;
  yearsWorked: number;
  createdAt: string;
}

export interface Slot {
  id: number;
  tutorId: number;
  date: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingUser {
  id: number;
  fullName: string;
  email: string;
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
  paidAt: string;
  createdAt: string;
  slot: Slot;
  tutor?: { id: number; user?: BookingUser; [key: string]: unknown };
  learner?: { id: number; user?: BookingUser; [key: string]: unknown };
}

export interface TutorCategory {
  id: number;
  name: string;
  slug: string;
}

export interface TutorProfile {
  id: number;
  about: string;
  bio: string;
  costPer30Min: number;
  profileImage: string | null;
  certificate: string | null;
  category: TutorCategory | null;
  rating: number | null;
  isApproved: boolean;
  /** From GET /auth/me when admin rejected the tutor application (null/omitted when not rejected or pending) */
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  workExperiences: WorkExperience[];
  slots?: Slot[];
  bookings?: Booking[];
}

export interface LearnerProfile {
  id: number;
  bookings?: Booking[];
  [key: string]: unknown;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  userType: 'LEARNER' | 'TUTOR' | 'ADMIN';
  createdAt: string;
  tutor?: TutorProfile;
  learner?: LearnerProfile;
}

interface AuthState {
  user: AuthUser | null;
}

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: { payload: AuthUser | null }) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export default authSlice.reducer;

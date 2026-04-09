import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, Spin, Alert, Button, Modal, message } from 'antd';
import { Check, ArrowLeft, Briefcase, Award, Calendar, Star, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { selectUser } from '@/store/authSlice';
import { assetUrl } from '@/shared/lib/assetUrl';
import { useTutorQuery, type SlotApi } from '@/entities/Tutor/api';
import { createCheckoutSession } from '@/entities/Booking/api';
import TutorReviews from '@/shared/ui/TutorReviews';
import ReviewForm from '@/shared/ui/ReviewForm';
import type { Booking } from '@/store/authSlice';

/** Normalize API date (ISO or YYYY-MM-DD) to YYYY-MM-DD */
function slotDateYMD(slot: SlotApi): string {
  const d = slot.date ?? '';
  return d.includes('T') ? d.slice(0, 10) : d;
}

function formatSlot(slot: SlotApi) {
  return `${slot.startTime}–${slot.endTime}`;
}

function formatSlotWithDate(slot: SlotApi) {
  const dateStr = slotDateYMD(slot);
  const formatted = dateStr ? new Date(dateStr + 'Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
  return formatted ? `${formatted} ${slot.startTime}–${slot.endTime}` : formatSlot(slot);
}

/** True if this slot's start time has already passed (e.g. today 10am, slot 9:00–9:30 is past). */
function isSlotPast(slot: SlotApi): boolean {
  const dateStr = slotDateYMD(slot);
  if (!dateStr || !slot.startTime) return false;
  const [hours, minutes] = slot.startTime.split(':').map(Number);
  const start = new Date(dateStr);
  start.setHours(hours, minutes ?? 0, 0, 0);
  return start.getTime() < Date.now();
}

function tomorrowYYYYMMDD(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function hasPaidBookingWithTutor(bookings: Booking[] | undefined, tutorId: number): boolean {
  return (bookings ?? []).some(
    (b) => b.tutorId === tutorId && (b.amountPaid > 0 || b.paymentStatus === 'paid')
  );
}

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { isAuthenticated } = useAuth();
  const [bookingDate, setBookingDate] = useState<string>(() => tomorrowYYYYMMDD());
  const { data: tutor, isLoading, isError, error, isFetching, refetch } = useTutorQuery(id, bookingDate);
  const canBook = !isAuthenticated || user?.userType === 'LEARNER';

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotApi | null>(null);
  const [startingPayment, setStartingPayment] = useState(false);

  const handleSlotClick = (slot: SlotApi) => {
    if (slot.booked || isSlotPast(slot)) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    setSelectedSlot(slot);
    setPaymentOpen(true);
  };

  const handleStartPayment = async () => {
    if (!selectedSlot) return;
    setStartingPayment(true);
    try {
      const { url } = await createCheckoutSession(selectedSlot.id);
      // Redirect to Stripe Checkout hosted page
      window.location.href = url;
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Failed to start payment');
      setStartingPayment(false);
    }
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedSlot(null);
    setStartingPayment(false);
  };

  if (isLoading) {
    return (
      <div className="pt-16 md:pt-[72px] py-12 px-4 min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !tutor) {
    return (
      <div className="pt-16 md:pt-[72px] py-12 px-4 min-h-screen">
        <div className="container mx-auto max-w-2xl">
          <Alert
            type="error"
            message="Tutor not found"
            description={error instanceof Error ? error.message : 'This profile may no longer exist.'}
            showIcon
            action={
              <Link to="/find-tutor">
                <Button size="small">Back to tutors</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const profileImageUrl = assetUrl(tutor.profileImage);
  const initials = tutor.user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const slots = tutor.slots ?? [];
  const reviews = tutor.reviews ?? [];
  const alreadyReviewed =
    !!user && reviews.some((r) => r.learner.user.id === user.id);
  const hasPaidBookingWithThisTutor = hasPaidBookingWithTutor(user?.learner?.bookings, tutor.id);
  const showReviewForm =
    isAuthenticated &&
    user?.userType === 'LEARNER' &&
    hasPaidBookingWithThisTutor &&
    !alreadyReviewed;

  return (
    <div className="pt-16 md:pt-[72px] py-12 px-4 min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/find-tutor"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tutors
        </Link>

        <Card className="rounded-2xl shadow-sm overflow-hidden border-0">
          {/* Profile header: image + name + certified */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative w-full sm:w-64 aspect-square sm:aspect-[1] rounded-2xl overflow-hidden bg-gray-200 shrink-0">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-semibold bg-gradient-to-br from-blue-500 to-indigo-600">
                  {initials}
                </div>
              )}
              {tutor.certificate && (
                <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/95 flex items-center justify-center shadow-md">
                  <Check className="w-6 h-6 text-amber-500" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {tutor.user.fullName}
              </h1>
              {tutor.certificate && (
                <span className="inline-flex items-center gap-1.5 text-green-600 font-medium mt-1">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                  Certified tutor
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {reviews.length > 0 && tutor.rating != null ? (
                  <>
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0" />
                    <span className="font-semibold text-gray-900">{tutor.rating.toFixed(1)}</span>
                    <span className="text-gray-500">
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">No reviews yet</span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span
                  className={`text-xl font-bold text-gray-900 ${!isAuthenticated ? 'blur-sm select-none' : ''}`}
                  title={!isAuthenticated ? 'Log in to see price' : undefined}
                >
                  {tutor.costPer30Min}$ <span className="text-base font-normal text-gray-500">/ 30 min</span>
                </span>
                <Button
                  type="default"
                  icon={<MessageCircle className="w-4 h-4" />}
                  className="rounded-xl"
                  disabled={!isAuthenticated}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
                      return;
                    }
                    // Socket chat:join expects the other *user* id, not tutor profile id
                    navigate(`/dashboard/chats?otherUserId=${tutor.user.id}`);
                  }}
                >
                  Message tutor
                </Button>
              </div>
            </div>
          </div>

          {/* Slots: learners/guests always see date picker and slot list (or empty message) */}
          {canBook && (
            <section className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Available times
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <label htmlFor="booking-date" className="text-sm text-gray-600">
                  Book for:
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              {isFetching ? (
                <p className="text-sm text-gray-500 py-4">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No slots on this day. Try another date.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">Click an available time to book.</p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => {
                      const past = isSlotPast(slot);
                      const disabled = slot.booked || past;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSlotClick(slot)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            disabled
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {formatSlot(slot)}
                          {slot.booked && ' (Booked)'}
                          {!slot.booked && past && ' (Passed)'}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}
          {!canBook && isAuthenticated && (
            <section className="mt-8 border-t border-gray-100 pt-8">
              <p className="text-gray-500 text-sm">Booking is for learners. Log in with a learner account to book a lesson.</p>
            </section>
          )}

          {/* Bio & about */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            {tutor.bio && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Short bio</h2>
                <p className="text-gray-700 leading-relaxed">{tutor.bio}</p>
              </section>
            )}
            {tutor.about && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{tutor.about}</p>
              </section>
            )}

            {tutor.category && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Category
                </h2>
                <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-700">
                  {tutor.category.name}
                </span>
              </section>
            )}

            {tutor.workExperiences?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Work experience
                </h2>
                <ul className="space-y-3">
                  {tutor.workExperiences.map((exp) => (
                    <li key={exp.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-xl bg-gray-50">
                      <div>
                        <span className="font-medium text-gray-900">{exp.role}</span>
                        <span className="text-gray-600"> at {exp.companyName}</span>
                      </div>
                      <span className="text-sm text-gray-500">{exp.yearsWorked} years</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="reviews" className="mt-8 border-t border-gray-100 pt-8 scroll-mt-24">
              {showReviewForm && (
                <div className="mb-8">
                  <ReviewForm tutorId={String(tutor.id)} onSuccess={() => void refetch()} />
                </div>
              )}
              {user?.userType === 'LEARNER' && hasPaidBookingWithThisTutor && alreadyReviewed && (
                <p className="text-sm text-gray-600 mb-6">You have already reviewed this tutor.</p>
              )}
              <TutorReviews reviews={reviews} />
            </section>
          </div>
        </Card>
      </div>

      {/* Stripe checkout */}
      <Modal
        title="Confirm booking"
        open={paymentOpen}
        onCancel={handlePaymentClose}
        footer={null}
        className="rounded-2xl"
        destroyOnClose
      >
        <div className="py-2">
          {selectedSlot && (
            <p className="text-gray-600 mb-4">
              {tutor.user.fullName} — {formatSlotWithDate(selectedSlot)} · {tutor.costPer30Min}$
            </p>
          )}
          <p className="text-sm text-gray-500 mb-6">
            You’ll be redirected to a secure payment page to complete your booking.
          </p>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleStartPayment}
            loading={startingPayment}
            className="rounded-xl bg-blue-600 font-semibold"
          >
            Continue to payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}

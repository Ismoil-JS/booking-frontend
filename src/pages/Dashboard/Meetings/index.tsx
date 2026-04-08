import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, List, Empty, Button } from 'antd';
import { Calendar, User, Clock } from 'lucide-react';
import { selectUser } from '@/store/authSlice';
import type { Booking } from '@/store/authSlice';

function formatBookingDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatSlotTime(slot: { startTime: string; endTime: string; date?: string }): string {
  return `${slot.startTime}–${slot.endTime}`;
}

function getOtherPartyName(booking: Booking, isTutor: boolean): string {
  if (isTutor && booking.learner?.user?.fullName) return booking.learner.user.fullName;
  if (!isTutor && booking.tutor?.user?.fullName) return booking.tutor.user.fullName;
  return isTutor ? 'Learner' : 'Tutor';
}

/** True if the slot end time has already passed (booking is in the past). */
function isBookingPast(booking: Booking): boolean {
  const dateStr = booking.slot?.date ?? booking.date;
  const endTime = booking.slot?.endTime;
  if (!dateStr || !endTime) return false;
  const [hours, minutes] = endTime.split(':').map(Number);
  const end = new Date(dateStr);
  end.setHours(hours, minutes, 59, 999);
  return end.getTime() < Date.now();
}

function BookingListItem({
  booking,
  isTutor,
}: {
  booking: Booking;
  isTutor: boolean;
}) {
  const isLearner = !isTutor;
  const canLeaveReview =
    isLearner &&
    isBookingPast(booking) &&
    (booking.amountPaid > 0 || booking.paymentStatus === 'paid');
  const hasFeeBreakdown =
    typeof booking.platformFee === 'number' || typeof booking.tutorEarning === 'number';
  const hasMeetLink = typeof booking.meetLink === 'string' && booking.meetLink.length > 0;
  const showJoinVideo = hasMeetLink && !isBookingPast(booking);
  return (
    <List.Item className="border-b border-gray-100 last:border-0 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              With {getOtherPartyName(booking, isTutor)}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4" />
              {formatBookingDate(booking.date)}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4" />
              {booking.slot && formatSlotTime(booking.slot)}
            </p>
            {showJoinVideo && (
              <div className="mt-3">
                <a
                  href={booking.meetLink!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button type="primary" size="small" className="bg-blue-600 rounded-lg">
                    Join video call
                  </Button>
                </a>
              </div>
            )}
            {canLeaveReview && (
              <div className="mt-2">
                <Link
                  to={`/tutor/${booking.tutorId}#reviews`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Leave a review
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 shrink-0">
          {booking.amountPaid != null && booking.amountPaid > 0 && (
            <div className="flex flex-col sm:items-end">
              <span className="font-medium">{booking.amountPaid}$ paid</span>
              {hasFeeBreakdown && (
                <span className="text-xs text-gray-500">
                  fee: {booking.platformFee ?? 0}$ · you: {booking.tutorEarning ?? 0}$
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </List.Item>
  );
}

export default function DashboardMeetings() {
  const user = useSelector(selectUser);
  const isTutor = user?.userType === 'TUTOR';
  const bookings: Booking[] = isTutor
    ? (user?.tutor?.bookings ?? [])
    : (user?.learner?.bookings ?? []);

  const upcoming = bookings.filter((b) => !isBookingPast(b));
  const history = bookings.filter((b) => isBookingPast(b));

  const hasAny = bookings.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meetings</h1>
      <p className="text-gray-600 mb-6">
        {isTutor
          ? 'Your scheduled lessons with students.'
          : 'Your scheduled lessons with tutors.'}
      </p>
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-gray-700">
        Please join your meeting <span className="font-semibold">10 minutes early</span>, log in with your account, and get ready so you can start on time.
      </div>

      {!hasAny ? (
        <Card className="rounded-2xl shadow-sm">
          <Empty
            description="No meetings yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-8"
          />
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="rounded-2xl shadow-sm" title={<span className="font-semibold">Upcoming</span>}>
            {upcoming.length === 0 ? (
              <Empty description="No upcoming meetings" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={upcoming}
                rowKey="id"
                renderItem={(booking) => <BookingListItem booking={booking} isTutor={!!isTutor} />}
              />
            )}
          </Card>

          <Card className="rounded-2xl shadow-sm" title={<span className="font-semibold">History</span>}>
            {history.length === 0 ? (
              <Empty description="No past meetings" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={history}
                rowKey="id"
                renderItem={(booking) => <BookingListItem booking={booking} isTutor={!!isTutor} />}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

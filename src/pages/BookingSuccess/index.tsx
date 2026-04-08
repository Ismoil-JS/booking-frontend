import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Spin } from 'antd';
import { CheckCircle } from 'lucide-react';
import { confirmPayment, type Booking } from '@/entities/Booking/api';
import { useAuth } from '@/contexts/AuthContext';

function money(n: number | undefined) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-';
  return `$${n.toFixed(2)}`;
}

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('No session ID found in URL.');
      setLoading(false);
      return;
    }

    confirmPayment({ sessionId })
      .then((data) => {
        setBooking(data);
        return refreshUser();
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to confirm payment');
      })
      .finally(() => setLoading(false));
  }, [searchParams, refreshUser]);

  return (
    <div className="pt-16 md:pt-[72px] py-12 px-4 min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <Card className="rounded-2xl shadow-sm">
          {loading && (
            <div className="py-10 flex items-center justify-center gap-3 text-gray-600">
              <Spin />
              Confirming your payment…
            </div>
          )}

          {!loading && error && (
            <Alert
              type="error"
              showIcon
              message="Payment Error"
              description={error}
              action={
                <Link to="/find-tutor">
                  <Button size="small">Browse tutors</Button>
                </Link>
              }
            />
          )}

          {!loading && !error && booking && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Booking confirmed!</h1>
                  <p className="text-gray-600 text-sm">Your session has been booked and paid successfully.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Booking ID</p>
                  <p className="font-semibold text-gray-900">{booking.id}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                  <p className="font-semibold text-gray-900">{booking.paymentStatus ?? 'paid'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Amount paid</p>
                  <p className="font-semibold text-gray-900">{money(booking.amountPaid)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Platform fee</p>
                  <p className="font-semibold text-gray-900">{money(booking.platformFee)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tutor earning</p>
                  <p className="font-semibold text-gray-900">{money(booking.tutorEarning)}</p>
                </div>
              </div>

              {booking.meetLink && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <h2 className="font-semibold text-gray-900 mb-1">Join your session</h2>
                  <p className="text-sm text-gray-600 mb-3">
                    Please join the meeting <span className="font-semibold">10 minutes early</span>, log in with your account, and get ready so you can start on time.
                  </p>
                  <a
                    href={booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:opacity-95 transition"
                  >
                    Join video call
                  </a>
                  <p className="text-xs text-gray-500 mt-2 break-all">{booking.meetLink}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Link to="/dashboard/meetings">
                  <Button type="primary" className="bg-blue-600 rounded-xl">
                    View my meetings
                  </Button>
                </Link>
                <Link to="/find-tutor">
                  <Button className="rounded-xl">Browse tutors</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


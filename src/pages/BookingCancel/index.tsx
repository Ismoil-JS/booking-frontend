import { Link } from 'react-router-dom';
import { Button, Card } from 'antd';
import { XCircle } from 'lucide-react';

export default function BookingCancel() {
  return (
    <div className="pt-16 md:pt-[72px] py-12 px-4 min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <Card className="rounded-2xl shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Payment cancelled</h1>
                <p className="text-gray-600 text-sm">You have not been charged.</p>
              </div>
            </div>

            <p className="text-gray-600">
              The slot is still available. You can go back and try again whenever you’re ready.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/find-tutor">
                <Button type="primary" className="bg-blue-600 rounded-xl">
                  Browse tutors
                </Button>
              </Link>
              <Link to="/dashboard/meetings">
                <Button className="rounded-xl">My meetings</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


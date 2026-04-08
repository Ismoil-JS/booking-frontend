import { Card, Empty, Spin, Table } from 'antd';
import { DollarSign } from 'lucide-react';
import { useTutorEarningsQuery, type EarningsBookingItem } from '@/entities/Booking/api';

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function DashboardEarnings() {
  const { data, isLoading, isError } = useTutorEarningsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <Empty description="Could not load earnings" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-10" />
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Earnings</h1>
      <p className="text-gray-600 mb-6">
        Summary of your paid lessons and platform fees ({data.platformFeePercent}%).
      </p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Your earnings</p>
              <p className="text-2xl font-bold text-gray-900">{money(data.totalEarnings)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total paid by learners</p>
          <p className="text-2xl font-bold text-gray-900">{money(data.totalAmountPaid)}</p>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Platform fees</p>
          <p className="text-2xl font-bold text-gray-900">{money(data.totalPlatformFees)}</p>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total sessions</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalBookings}</p>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm" title={<span className="font-semibold">Paid bookings</span>}>
        {data.bookings.length === 0 ? (
          <Empty description="No paid bookings yet" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-10" />
        ) : (
          <Table<EarningsBookingItem>
            rowKey="id"
            dataSource={data.bookings}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                render: (v: string) => new Date(v).toLocaleDateString(),
              },
              {
                title: 'Time',
                render: (_, r) => `${r.startTime}–${r.endTime}`,
              },
              { title: 'Learner', dataIndex: 'learnerName' },
              {
                title: 'Paid',
                dataIndex: 'amountPaid',
                render: (v: number) => money(v),
              },
              {
                title: 'Fee',
                dataIndex: 'platformFee',
                render: (v: number) => money(v),
              },
              {
                title: 'Your earning',
                dataIndex: 'tutorEarning',
                render: (v: number) => money(v),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}


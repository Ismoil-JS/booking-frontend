import { Card } from 'antd';

export default function DashboardReports() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports (Hisobot)</h1>
      <Card className="rounded-2xl shadow-sm">
        <p className="text-gray-600">Analytics and reports for your tutoring activity.</p>
        <p className="text-gray-400 text-sm mt-2">Charts and stats will be integrated here.</p>
      </Card>
    </div>
  );
}

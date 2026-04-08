import { Card } from 'antd';

export default function DashboardComments() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Comments</h1>
      <Card className="rounded-2xl shadow-sm">
        <p className="text-gray-600">Comments you left on tutors’ lessons after your sessions.</p>
        <p className="text-gray-400 text-sm mt-2">No comments yet.</p>
      </Card>
    </div>
  );
}

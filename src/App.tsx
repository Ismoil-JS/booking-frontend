import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/shared/ProtectedRoute';
import Layout from '@/shared/layout';
import DashboardLayout from '@/shared/dashboardLayout';
import LandingPage from '@/pages/LandingPage/index';
import FindTutor from '@/pages/FindTutor/index';
import BecomeTutor from '@/pages/BecomeTutor/index';
import Login from '@/pages/Login/index';
import Signup from '@/pages/Signup/index';
import DashboardIndex from '@/pages/Dashboard/index';
import DashboardProfile from '@/pages/Dashboard/Profile/index';
import DashboardMeetings from '@/pages/Dashboard/Meetings/index';
import DashboardCalendar from '@/pages/Dashboard/Calendar/index';
import DashboardReports from '@/pages/Dashboard/Reports/index';
import DashboardComments from '@/pages/Dashboard/Comments/index';
import DashboardEarnings from '@/pages/Dashboard/Earnings/index';
import TutorProfile from '@/pages/TutorProfile/index';
import ChatPage from '@/pages/Chat/index';
import BookingSuccess from '@/pages/BookingSuccess/index';
import BookingCancel from '@/pages/BookingCancel/index';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#2563eb',
            borderRadius: 12,
          },
        }}
      >
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardIndex />} />
                <Route path="profile" element={<DashboardProfile />} />
                <Route path="meetings" element={<DashboardMeetings />} />
                <Route path="calendar" element={<DashboardCalendar />} />
                <Route path="reports" element={<DashboardReports />} />
                <Route path="comments" element={<DashboardComments />} />
                <Route path="earnings" element={<DashboardEarnings />} />
                <Route path="chat" element={<ChatPage />} />
              </Route>
              <Route path="/" element={<Layout />}>
                <Route index element={<LandingPage />} />
                <Route path="find-tutor" element={<FindTutor />} />
                <Route path="tutor/:id" element={<TutorProfile />} />
                <Route path="become-tutor" element={<BecomeTutor />} />
                <Route path="booking/success" element={<BookingSuccess />} />
                <Route path="booking/cancel" element={<BookingCancel />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;

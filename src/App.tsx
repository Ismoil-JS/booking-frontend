import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/shared/ProtectedRoute';
import ScrollToTop from '@/shared/ScrollToTop';
import Layout from '@/shared/layout';
import AccountAreaLayout from '@/shared/AccountAreaLayout';
import LandingPage from '@/pages/LandingPage/index';
import FindTutor from '@/pages/FindTutor/index';
import BecomeTutor from '@/pages/BecomeTutor/index';
import Login from '@/pages/Login/index';
import Signup from '@/pages/Signup/index';
import DashboardProfile from '@/pages/Dashboard/Profile/index';
import DashboardMeetings from '@/pages/Dashboard/Meetings/index';
import DashboardCalendar from '@/pages/Dashboard/Calendar/index';
import DashboardReports from '@/pages/Dashboard/Reports/index';
import DashboardComments from '@/pages/Dashboard/Comments/index';
import DashboardEarnings from '@/pages/Dashboard/Earnings/index';
import TutorProfile from '@/pages/TutorProfile/index';
import ChatPage from '@/pages/Chat/index';
import RealtimeChatsPage from '@/pages/RealtimeChats/index';
import RealtimeConversationPage from '@/pages/RealtimeChats/Conversation';
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
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Old /dashboard URLs redirect to the new flat routes */}
              <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
              <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/dashboard/meetings" element={<Navigate to="/meetings" replace />} />
              <Route path="/dashboard/calendar" element={<Navigate to="/calendar" replace />} />
              <Route path="/dashboard/reports" element={<Navigate to="/reports" replace />} />
              <Route path="/dashboard/comments" element={<Navigate to="/comments" replace />} />
              <Route path="/dashboard/earnings" element={<Navigate to="/earnings" replace />} />
              <Route path="/dashboard/chat" element={<Navigate to="/ai-chat" replace />} />
              <Route path="/dashboard/chats" element={<Navigate to="/chats" replace />} />
              <Route path="/dashboard/chats/:id" element={<Navigate to="/chats" replace />} />

              {/* Single shared layout (Navbar + Footer) for everything */}
              <Route path="/" element={<Layout />}>
                <Route index element={<LandingPage />} />
                <Route path="find-tutor" element={<FindTutor />} />
                <Route path="tutor/:id" element={<TutorProfile />} />
                <Route path="become-tutor" element={<BecomeTutor />} />
                <Route path="booking/success" element={<BookingSuccess />} />
                <Route path="booking/cancel" element={<BookingCancel />} />

                {/* Account-center routes (protected, share padded wrapper) */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AccountAreaLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="profile" element={<DashboardProfile />} />
                  <Route path="meetings" element={<DashboardMeetings />} />
                  <Route path="calendar" element={<DashboardCalendar />} />
                  <Route path="reports" element={<DashboardReports />} />
                  <Route path="comments" element={<DashboardComments />} />
                  <Route path="earnings" element={<DashboardEarnings />} />
                  <Route path="ai-chat" element={<ChatPage />} />
                  <Route path="chats" element={<RealtimeChatsPage />} />
                  <Route path="chats/:id" element={<RealtimeConversationPage />} />
                </Route>
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

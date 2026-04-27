import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert } from 'antd';
import { selectUser } from '@/store/authSlice';

/**
 * Layout for protected "account center" pages (Profile, Meetings, Chats, etc.).
 *
 * - Adds the top padding required because the Navbar is `position: fixed`.
 * - Surfaces the tutor application status banner that previously lived in
 *   the dashboard sidebar layout.
 * - Constrains content width and adds consistent page padding.
 */
export default function AccountAreaLayout() {
  const user = useSelector(selectUser);

  const tutorPendingApproval =
    user?.userType === 'TUTOR' && user.tutor && !user.tutor.isApproved;
  const tutorRejectedWithReason =
    tutorPendingApproval && Boolean(user?.tutor?.rejectionReason?.trim());

  return (
    <div className="pt-16 md:pt-[72px] min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl p-4 md:p-6">
        {tutorRejectedWithReason ? (
          <Alert
            type="error"
            showIcon
            className="mb-4 rounded-xl border-red-200"
            message="Your application was not approved"
            description={
              <div className="text-gray-800 whitespace-pre-wrap">
                {user?.tutor?.rejectionReason}
              </div>
            }
          />
        ) : tutorPendingApproval ? (
          <Alert
            type="info"
            showIcon
            className="mb-4 rounded-xl"
            message="Application under review"
            description="Your tutor profile is pending approval. You’ll be able to use all tutor features once the team has reviewed it."
          />
        ) : null}
        <Outlet />
      </div>
    </div>
  );
}

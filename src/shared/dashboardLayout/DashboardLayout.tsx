import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layout, Menu, Button, Tooltip, FloatButton, Alert } from 'antd';
import {
  User,
  Video,
  Calendar,
  DollarSign,
  MessageCircle,
  Menu as MenuIcon,
  X,
  LogOut,
} from 'lucide-react';
import { selectUser } from '@/store/authSlice';
import { useAuth } from '@/contexts/AuthContext';

const { Sider, Content, Header } = Layout;

const tutorMenus = [
  { key: 'profile', path: '/dashboard/profile', label: 'Profile', icon: User },
  { key: 'meetings', path: '/dashboard/meetings', label: 'Meetings', icon: Video },
  { key: 'calendar', path: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { key: 'earnings', path: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { key: 'chat', path: '/dashboard/chat', label: 'AI Chat', icon: MessageCircle },
];

const learnerMenus = [
  { key: 'profile', path: '/dashboard/profile', label: 'Profile', icon: User },
  { key: 'meetings', path: '/dashboard/meetings', label: 'Meetings', icon: Video },
  { key: 'chat', path: '/dashboard/chat', label: 'AI Chat', icon: MessageCircle },
];

export default function DashboardLayout() {
  const user = useSelector(selectUser);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const isTutor = user?.userType === 'TUTOR';
  const menus = isTutor ? tutorMenus : learnerMenus;

  const tutorPendingApproval =
    user?.userType === 'TUTOR' && user.tutor && !user.tutor.isApproved;
  const tutorRejectedWithReason =
    tutorPendingApproval && Boolean(user?.tutor?.rejectionReason?.trim());

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Layout className="min-h-screen">
      {/* Desktop sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        className="hidden lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-sm"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
          <Link
            to="/"
            className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent overflow-hidden truncate hover:opacity-90"
          >
            BISP
          </Link>
          <Button
            type="text"
            icon={collapsed ? <MenuIcon className="w-5 h-5" /> : <X className="w-5 h-5" />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 flex-shrink-0"
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[menus.find((m) => location.pathname === m.path)?.path ?? '']}
          className="border-0 mt-4 px-2 flex-1 overflow-y-auto"
          style={{ minHeight: 0 }}
          items={menus.map((m) => ({
            key: m.path,
            icon: <m.icon className="w-5 h-5" />,
            label: <NavLink to={m.path}>{m.label}</NavLink>,
          }))}
        />
        <div className="p-3 border-t border-gray-100 flex-shrink-0 flex flex-col gap-2">
          {!collapsed && (
            <span className="text-sm text-gray-600 truncate px-2" title={user?.fullName ?? ''}>
              {user?.fullName}
            </span>
          )}
          <Tooltip title="Log out" placement="right">
            <Button
              type="default"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              className="rounded-xl w-full"
            >
              {collapsed ? null : 'Log out'}
            </Button>
          </Tooltip>
        </div>
      </Sider>

      {/* Mobile menu button */}
      <Header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
        <Button
          type="text"
          icon={<MenuIcon className="w-6 h-6" />}
          onClick={() => setMobileOpen(true)}
        />
        <Link to="/" className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-90">
          BISP
        </Link>
        <div className="w-10" />
      </Header>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0">
              <Link to="/" className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-90" onClick={() => setMobileOpen(false)}>
                BISP
              </Link>
              <Button type="text" icon={<X className="w-5 h-5" />} onClick={() => setMobileOpen(false)} />
            </div>
            <nav className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
              {menus.map((m) => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <m.icon className="w-5 h-5" />
                  {m.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100 flex-shrink-0 flex flex-col gap-2">
              <span className="text-sm text-gray-600 truncate" title={user?.fullName ?? ''}>
                {user?.fullName}
              </span>
              <Button
                type="default"
                icon={<LogOut className="w-4 h-4" />}
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="rounded-xl w-full"
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}

      <Layout className={collapsed ? 'lg:pl-[80px]' : 'lg:pl-[260px]'} style={{ minHeight: '100vh', width: '100%', minWidth: 0 }}>
        <Header className="bg-white border-b border-gray-100 h-16 pt-16 lg:pt-0 flex-shrink-0" />
        <Content className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-4rem)]">
          {tutorRejectedWithReason ? (
            <Alert
              type="error"
              showIcon
              className="mb-4 rounded-xl border-red-200"
              message="Your application was not approved"
              description={
                <div className="text-gray-800 whitespace-pre-wrap">{user?.tutor?.rejectionReason}</div>
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
        </Content>
        <FloatButton
          type="primary"
          icon={<MessageCircle className="w-5 h-5" />}
          tooltip="Chat with me"
          onClick={() => navigate('/dashboard/chat')}
          style={{ right: 24, bottom: 24 }}
        />
      </Layout>
    </Layout>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { to: '/find-tutor', label: 'Find Tutor' },
  { to: '/become-tutor', label: 'Become Tutor' },
];

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 md:h-[72px]
        bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-lg
        transition-all duration-300"
    >
      <div className="container mx-auto h-full px-4 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
        >
          BISP
        </Link>

        {/* Center nav - desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors duration-300"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: avatar dropdown (custom so Link works) */}
        <div className="flex items-center gap-4">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="p-1 rounded-full text-gray-600 hover:text-blue-600 hover:bg-white/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              <UserCircle className="w-9 h-9 md:w-10 md:h-10" strokeWidth={1.5} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 min-w-[220px] rounded-xl shadow-xl border border-gray-100 bg-white py-2 overflow-hidden z-[100]"
                role="menu"
              >
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Account
                </p>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 no-underline"
                      role="menuitem"
                    >
                      <LayoutDashboard className="w-5 h-5 text-gray-500 shrink-0" />
                      To dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                      role="menuitem"
                    >
                      <LogOut className="w-5 h-5 shrink-0" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 no-underline"
                      role="menuitem"
                    >
                      <LogIn className="w-5 h-5 text-gray-500 shrink-0" />
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left font-medium text-blue-600 hover:bg-blue-50 transition-colors duration-200 no-underline"
                      role="menuitem"
                    >
                      <UserPlus className="w-5 h-5 shrink-0" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger - mobile */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-white/80 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BISP
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 rounded-xl text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  {label}
                </Link>
              ))}
              <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="py-3 px-4 rounded-xl text-left font-medium text-gray-700 hover:bg-gray-100"
                    >
                      To dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="py-3 px-4 rounded-xl text-left font-medium text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="py-3 px-4 rounded-xl text-left font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="py-3 px-4 rounded-xl text-left font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

    </header>
  );
};

export default Navbar;

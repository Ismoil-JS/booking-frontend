import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route's pathname changes.
 *
 * React Router does not reset scroll position on navigation by default —
 * if a user navigates from a long, scrolled page (e.g. Chats) to another
 * page via the avatar dropdown, the new page would otherwise start mid-way.
 *
 * Drop this once near the top of the router tree.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // `auto` (instant) feels right for navigation; `smooth` would lag on long pages.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

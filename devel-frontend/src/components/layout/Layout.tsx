import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Footer } from './Footer';
import { Header } from './Header';

/** The frame around every page: header, the page itself (<Outlet />), footer. */
export function Layout() {
  const { pathname } = useLocation();

  // A single-page app keeps the scroll position between "pages"; reset it like a real navigation.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-width flex-1 py-12 sm:py-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

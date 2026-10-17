import { Link, NavLink } from 'react-router';
import { site } from '../../config/site';
import { ThemeToggle } from '../ThemeToggle';

// LEARN: NavLink adds styling for the current page via the function passed to className.
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-subtle text-ink'
      : 'muted-link'
  }`;

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-accent" />
          {site.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Posts
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
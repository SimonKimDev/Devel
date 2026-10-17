import { Link, NavLink } from 'react-router';
import { site } from '../../config/site';
import { ThemeToggle } from '../ThemeToggle';

// LEARN: NavLink adds styling for the current page via the function passed to className.
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
  }`;

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-accent-600 dark:bg-accent-400" />
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
import { Link, NavLink } from 'react-router';
import { site } from '../../config/site';
import { ThemeToggle } from '../ThemeToggle';

// LEARN: NavLink marks the link for the current page with aria-current="page";
// the .nav-link styles in index.css highlight it from that attribute.
export function Header() {
  return (
    <header className="site-header">
      <div className="page-width flex h-16 items-center justify-between">
        <Link to="/" className="brand">
          <span aria-hidden="true" className="brand-dot" />
          {site.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink to="/" end className="nav-link">
            Posts
          </NavLink>
          <NavLink to="/about" className="nav-link">
            About
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

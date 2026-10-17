import { site } from '../../config/site';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="page-width py-8 text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}

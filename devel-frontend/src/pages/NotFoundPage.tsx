import { Link } from "react-router";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage({ message = "The page you're looking for doesn't exist." }: { message?: string }) {
  useDocumentTitle("Not found");

  return (
    <div className="py-16 text-center">
      <p className="font-serif text-7xl font-semibold text-accent">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">{message}</p>
      <Link to="/" className="button mt-8">
        Back to all posts
      </Link>
    </div>
  );
}

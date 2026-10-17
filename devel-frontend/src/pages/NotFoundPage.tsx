import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage({ message = "The page you're looking for doesn't exist." }: { message?: string }) {
  useDocumentTitle('Not found');

  return (
    <div className="py-16 text-center">
      <p className="font-serif text-7xl font-semibold text-accent-600 dark:text-accent-400">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">{message}</p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Back to all posts
      </Link>
    </div>
  );
}
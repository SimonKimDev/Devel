import { site } from '../../config/site';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <p>
          © {new Date().getFullYear()} {site.author}. Built with React, Go and Azure.
        </p>
        <a href={site.githubUrl} className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
import { site } from '../config/site';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AboutPage() {
  useDocumentTitle('About');

  return (
    <article className="max-w-[68ch]">
      <h1 className="mb-8 font-serif text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
        About
      </h1>
      <div className="prose prose-zinc max-w-none dark:prose-invert prose-a:text-accent-600 dark:prose-a:text-accent-400">
        <p>
          I'm {site.author}, a backend engineer who builds distributed services for a living. {site.name} is where I
          learn the rest of the stack in public: the browser, TypeScript and React, and how a click turns into a
          database row and back.
        </p>
        <p>The site is the project. Under the hood:</p>
        <ul>
          <li>React and TypeScript, built with Vite and styled with Tailwind CSS.</li>
          <li>A Go API on the standard library's net/http router.</li>
          <li>Azure Static Web Apps and Azure Container Apps, defined in Bicep.</li>
          <li>GitHub Actions for CI/CD, with an AI reviewer on every pull request.</li>
        </ul>
        <p>
          All of it is open source on <a href={site.githubUrl}>GitHub</a>.
        </p>
      </div>
    </article>
  );
}
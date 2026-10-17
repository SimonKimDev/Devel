import type { Heading } from '../lib/extractHeadings';

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">On this page</p>
      <ul className="space-y-2 border-l border-zinc-200 dark:border-zinc-800">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? 'pl-7' : 'pl-4'}>
            <a
              href={`#${heading.id}`}
              className="-ml-px block border-l border-transparent pl-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
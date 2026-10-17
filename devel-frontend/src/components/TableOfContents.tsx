import type { Heading } from '../lib/extractHeadings';

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-semibold text-ink">On this page</p>
      <ul className="space-y-2 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? 'pl-7' : 'pl-4'}>
            <a
              href={`#${heading.id}`}
              className="muted-link block"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
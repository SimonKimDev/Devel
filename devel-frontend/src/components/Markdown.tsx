import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

// LEARN: Markdown → HTML happens in the browser. remark-gfm adds tables and task lists,
// rehype-slug gives each heading an id (the table of contents links to them), and
// rehype-highlight colors code blocks. react-markdown ignores raw HTML in the Markdown,
// so a post can't inject <script> tags. Styling comes from the `prose` classes below
// (Tailwind's typography plugin).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-zinc max-w-none sm:prose-lg dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:tracking-tight prose-a:text-accent-600 prose-a:underline-offset-2 hover:prose-a:text-accent-700 dark:prose-a:text-accent-400 prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-zinc-800 prose-pre:rounded-xl prose-pre:bg-zinc-900 dark:prose-pre:ring-1 dark:prose-pre:ring-zinc-800 prose-th:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

// LEARN: Markdown → HTML happens in the browser. remark-gfm adds tables and task lists,
// rehype-slug gives each heading an id (the table of contents links to them), and
// rehype-highlight colors code blocks. react-markdown ignores raw HTML in the Markdown,
// so a post can't inject <script> tags. Styling comes from the `prose` classes below
// (Tailwind's typography plugin); its colors come from the theme in index.css.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose max-w-none sm:prose-lg prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:tracking-tight prose-a:underline-offset-2 hover:prose-a:text-accent-strong prose-code:rounded prose-code:bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:ring-1 prose-pre:ring-white/10 prose-th:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
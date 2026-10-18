import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

// LEARN: Markdown → HTML happens in the browser. remark-gfm adds tables and task lists,
// rehype-slug gives each heading an id (the table of contents links to them), and
// rehype-highlight colors code blocks. react-markdown ignores raw HTML in the Markdown,
// so a post can't inject <script> tags. `prose` is Tailwind's typography plugin; `.article`
// in index.css holds our tweaks on top of it.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose article sm:prose-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          pre: CodeBlock,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

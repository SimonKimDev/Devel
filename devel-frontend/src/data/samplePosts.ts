import type { Post } from '../types/post';
import helloDevel from './posts/hello-devel.md?raw';
import aksToContainerApps from './posts/aks-to-container-apps.md?raw';
import craToVite from './posts/cra-to-vite.md?raw';
import netHttpRouter from './posts/net-http-router.md?raw';
import aiReviewer from './posts/ai-reviewer.md?raw';

// LEARN: hardcoded sample posts, shaped exactly like the Go API's JSON. The Markdown
// bodies live in ./posts/*.md and are imported as plain strings with Vite's `?raw`.
// Once the frontend reads from the API (see services/posts.ts), this file goes away.
export const samplePosts: Post[] = [
  {
    post_id: 1,
    author_id: 1,
    title: 'Hello, Devel',
    slug: 'hello-devel',
    summary: 'Why this blog exists, what it will cover, and how the site itself is built.',
    body_markdown: helloDevel,
    date_published: '2026-09-02T09:00:00Z',
    date_updated: '2026-09-02T09:00:00Z',
    tags: ['meta'],
  },
  {
    post_id: 2,
    author_id: 1,
    title: 'From AKS to Container Apps: a $70 lesson',
    slug: 'aks-to-container-apps',
    summary:
      'A two-node Kubernetes cluster for one container was overkill. Here is what replaced it, and what it costs now.',
    body_markdown: aksToContainerApps,
    date_published: '2026-09-18T09:00:00Z',
    date_updated: '2026-09-20T15:30:00Z',
    tags: ['azure', 'infra'],
  },
  {
    post_id: 3,
    author_id: 1,
    title: 'Why moving from Create React App to Vite cleared 117 alerts',
    slug: 'cra-to-vite',
    summary:
      'Dependabot found 117 vulnerabilities, none of them in my code. Swapping the build tool fixed them all.',
    body_markdown: craToVite,
    date_published: '2026-10-03T09:00:00Z',
    date_updated: '2026-10-03T09:00:00Z',
    tags: ['frontend', 'security'],
  },
  {
    post_id: 4,
    author_id: 1,
    title: 'Routing in Go without a framework',
    slug: 'net-http-router',
    summary: 'Go 1.22 made the standard library router good enough. Rebuilding the API on net/http.',
    body_markdown: netHttpRouter,
    date_published: '2026-10-09T09:00:00Z',
    date_updated: '2026-10-09T09:00:00Z',
    tags: ['go', 'backend'],
  },
  {
    post_id: 5,
    author_id: 1,
    title: 'Teaching an AI reviewer to stop nitpicking',
    slug: 'ai-reviewer',
    summary:
      'Two models review every pull request now. The hard part was making their feedback worth reading.',
    body_markdown: aiReviewer,
    date_published: '2026-10-16T09:00:00Z',
    date_updated: '2026-10-16T09:00:00Z',
    tags: ['ci', 'ai'],
  },
];
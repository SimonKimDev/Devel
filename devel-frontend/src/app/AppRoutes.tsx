import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from '../components/layout/Layout';
import { StatusMessage } from '../components/StatusMessage';
import { AboutPage } from '../pages/AboutPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// The post page pulls in the Markdown renderer and syntax highlighter, the heaviest code
// on the site, so it's downloaded only when someone opens a post.
const PostPage = lazy(() => import('../pages/PostPage').then((m) => ({ default: m.PostPage })));

// LEARN: every URL the site has is listed here. `:slug` is a URL parameter the post page
// reads with useParams(). Static Web Apps sends every unknown path to index.html
// (infra/web/staticwebapp.config.json), and this router decides what to show.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="posts/:slug"
          element={
            <Suspense fallback={<StatusMessage title="Loading post…" />}>
              <PostPage />
            </Suspense>
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { site } from '../config/site';
import { fixturePosts } from '../test/fixturePosts';
import { AppRoutes } from './AppRoutes';

// Tests use fake posts, so they don't break when real posts change.
vi.mock('../data/samplePosts', async () => ({ samplePosts: (await import('../test/fixturePosts')).fixturePosts }));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

const newest = [...fixturePosts].sort((a, b) => b.date_published.localeCompare(a.date_published));

afterEach(() => {
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('home page', () => {
  test('lists every post newest first, each linking to its page', async () => {
    renderAt('/');

    const titles = await screen.findAllByRole('heading', { level: 2 });
    expect(titles.map((h) => h.textContent)).toEqual(newest.map((p) => p.title));
    expect(screen.getByRole('link', { name: newest[0].title })).toHaveAttribute('href', `/posts/${newest[0].slug}`);
  });

  test('shows the date and reading time on each card', async () => {
    renderAt('/');

    const card = (await screen.findByRole('link', { name: newest[0].title })).closest('article')!;
    expect(within(card).getByText(/min read/)).toBeInTheDocument();
  });
});

describe('post page', () => {
  const post = fixturePosts.find((p) => p.slug === 'routing-post')!;

  test('renders the title, byline and Markdown body', async () => {
    renderAt(`/posts/${post.slug}`);

    expect(await screen.findByRole('heading', { level: 1, name: post.title })).toBeInTheDocument();
    expect(screen.getByText('Simon Kim')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Layers' })).toBeInTheDocument();
    expect(screen.getByText(/http\.NewServeMux/)).toBeInTheDocument();
    expect(document.title).toBe(`${post.title} · ${site.name}`);
  });

  test('table of contents links point at the rendered headings', async () => {
    renderAt(`/posts/${post.slug}`);

    const toc = await screen.findByRole('navigation', { name: 'On this page' });
    const links = within(toc).getAllByRole('link');
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      const id = link.getAttribute('href')!.slice(1);
      expect(document.getElementById(id)).toHaveTextContent(link.textContent!);
    }
  });

  test('shows other posts under "More posts"', async () => {
    renderAt(`/posts/${post.slug}`);

    const more = await screen.findByRole('region', { name: 'More posts' });
    expect(within(more).getAllByRole('article')).toHaveLength(2);
    expect(within(more).queryByText(post.title)).not.toBeInTheDocument();
  });

  test('shows a not-found page for an unknown slug', async () => {
    renderAt('/posts/no-such-post');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText("There's no post at this address.")).toBeInTheDocument();
  });
});

test('unknown routes show the 404 page', async () => {
  renderAt('/nope');

  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to all posts' })).toHaveAttribute('href', '/');
});

test('header navigation goes to the About page', async () => {
  const user = userEvent.setup();
  renderAt('/');

  await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'About' }));

  expect(await screen.findByRole('heading', { level: 1, name: /if we feel like it/ })).toBeInTheDocument();
});

test('theme toggle switches to dark and remembers it', async () => {
  const user = userEvent.setup();
  renderAt('/');

  await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
});
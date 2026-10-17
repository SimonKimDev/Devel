import { getPostBySlug, getPosts } from './posts';

test('getPosts returns posts newest first', async () => {
  const posts = await getPosts();
  const dates = posts.map((p) => p.date_published);

  expect(posts.length).toBeGreaterThan(1);
  expect(dates).toEqual([...dates].sort().reverse());
});

test('getPostBySlug finds a post or returns null', async () => {
  const [first] = await getPosts();

  expect(await getPostBySlug(first.slug)).toEqual(first);
  expect(await getPostBySlug('no-such-post')).toBeNull();
});
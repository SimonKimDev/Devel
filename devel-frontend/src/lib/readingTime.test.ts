import { readingTime } from './readingTime';

test('rounds up to whole minutes at 200 words per minute', () => {
  expect(readingTime(Array(201).fill('word').join(' '))).toBe(2);
});

test('is at least one minute', () => {
  expect(readingTime('')).toBe(1);
  expect(readingTime('short post')).toBe(1);
});

test('ignores code blocks', () => {
  const code = '```\n' + Array(1000).fill('token').join(' ') + '\n```';
  expect(readingTime(`${Array(150).fill('word').join(' ')}\n\n${code}`)).toBe(1);
});
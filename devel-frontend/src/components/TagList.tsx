export function TagList({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;

  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-950 dark:text-accent-300"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
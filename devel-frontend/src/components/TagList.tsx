export function TagList({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;

  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className="tag">
          {tag}
        </li>
      ))}
    </ul>
  );
}

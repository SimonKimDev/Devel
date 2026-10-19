import { Link } from "react-router";

export function TagList({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;

  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className="tag">
          <Link to={`/?tag=${encodeURIComponent(tag)}`} className="tag ...">
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}

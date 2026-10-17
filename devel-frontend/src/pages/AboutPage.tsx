import { site } from '../config/site';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type Member = { name: string; role: string; github?: string };

// LEARN: content that repeats in the same shape is data; the markup maps over it once.
const team: Member[] = [
  {
    name: 'Simon Kim',
    role: 'Software Dev, Microsoft',
    github: 'https://github.com/SimonKimDev',
  },
  {
    name: 'Sean Brock',
    role: 'Software Dev, Meta',
    github: 'https://github.com/sean-brock',
  },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');

export function AboutPage() {
  useDocumentTitle('About');

  return (
    <>
      <section className="reading-width mb-16">
        <p className="eyebrow mb-3">About</p>
        <h1 className="page-title text-balance">
          Open source, if we feel like it
        </h1>
        <div className="prose article mt-6 sm:prose-lg">
          <p>
            {site.name} is a loosely coupled indie software dev team. We build
            projects once in a while when we feel motivated, and we write about
            them here on this blog because we are full of ourselves.
          </p>
          <p>
            This blog is open sourced on <a href={site.githubUrl}>GitHub</a>.
          </p>
        </div>
      </section>

      <section aria-labelledby="team" className="divider">
        <h2 id="team" className="section-title mb-6">
          Members
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2">
          {team.map((member) => (
            <li key={member.name} className="card flex-row items-center gap-4">
              <span aria-hidden="true" className="avatar size-14 text-lg">
                {initials(member.name)}
              </span>
              <div>
                <p className="card-title text-xl">
                  {member.github ? (
                    <a href={member.github} className="stretched-link">
                      {member.name}
                    </a>
                  ) : (
                    member.name
                  )}
                </p>
                <p className="text-sm text-muted">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

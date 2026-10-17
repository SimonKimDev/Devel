Every developer blog starts with a post like this one, so let's get it over with.

Devel is my development diary. I'm a backend engineer by day, comfortable with C# and services, and this site is where I teach myself the rest of the stack: the browser, TypeScript, React, and everything between a click and a database row.

## What lives here

- **Build logs.** What I changed, why, and what broke along the way.
- **Things I learned the hard way.** Usually the same thing twice.
- **Notes to future me.** Because I *will* forget how the deploy works.

## How the site is built

The site itself is the project:

| Layer | What it is |
| --- | --- |
| Frontend | React + TypeScript, built with Vite, styled with Tailwind |
| API | Go, standard library `net/http` |
| Hosting | Azure Static Web Apps and Azure Container Apps |
| Infra | Bicep, deployed by GitHub Actions with OIDC |

The source is public on [GitHub](https://github.com/SimonKimDev/Devel) if you want to follow along.
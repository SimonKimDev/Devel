Turning on Dependabot security alerts for this repo produced a number I didn't expect: **117 vulnerabilities**, all in the frontend.

## Where they came from

None of them were in code I wrote. They came from `react-scripts`, the build tool behind Create React App, which pulled in more than 1,500 packages. Create React App is deprecated, so those dependencies weren't getting fixed upstream.

## The migration

Moving to Vite took one afternoon:

- `react-scripts start/build/test` became `vite`, `vite build` and `vitest`.
- Environment variables went from `REACT_APP_*` to `VITE_*`.
- `public/index.html` moved to the project root and loads the entry module directly.

```ts
// Before (Create React App)
const baseUrl = process.env.REACT_APP_API_BASE_URL;

// After (Vite)
const baseUrl = import.meta.env.VITE_API_BASE_URL;
```

## The result

| | Before | After |
| --- | --- | --- |
| Packages installed | 1,541 | 238 |
| `npm audit` findings | 117 | 0 |
| Production build | ~30 s | under 1 s |

The best security fix is sometimes deleting the thing that needs fixing.
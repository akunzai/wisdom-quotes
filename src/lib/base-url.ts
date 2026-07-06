/** BASE_URL with trailing slash for safe path joining (e.g. `/wisdom-quotes/`). */
export function baseUrl(): string {
  const base = import.meta.env.BASE_URL;
  return base.endsWith('/') ? base : `${base}/`;
}

/** Join a path segment to the site base URL. */
export function withBase(path = ''): string {
  const base = baseUrl();
  if (!path) return base;
  return `${base}${path.replace(/^\//, '')}`;
}
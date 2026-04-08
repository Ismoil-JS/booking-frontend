/** Resolve relative asset paths (e.g. /uploads/...) to full URL using API base. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_BASE_URL as string) ?? '';
  const baseClean = base.replace(/\/$/, '');
  return `${baseClean}${path.startsWith('/') ? path : '/' + path}`;
}

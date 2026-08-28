export function normalizeURL(urlString: string): string {
  const url = new URL(urlString);
  const fullPath = `${url.hostname}${url.pathname}`;
  if (fullPath.endsWith('/')) {
    return fullPath.slice(0, -1);
  }
  return fullPath;
}

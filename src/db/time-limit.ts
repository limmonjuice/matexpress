/**
 * A fetch that gives up after `ms`. The database driver has no limit of its own, so a database that takes a
 * request and goes quiet would leave a buyer on a spinner until the host ends the request, minutes later.
 */
export function fetchWithin(ms: number) {
  return (url: string, init?: RequestInit) => fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}
